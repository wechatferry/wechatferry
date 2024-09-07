import EventEmitter from 'node:events'
import process from 'node:process'
import { setTimeout } from 'node:timers/promises'
import os from 'node:os'
import type { Wechatferry, wcf } from '@wechatferry/core'
import { FileBox, type FileBoxInterface } from 'file-box'
import type { Knex } from 'knex'
import type { AnyFunction, ThrottledFunction } from 'p-throttle'
import type { PromiseReturnType, WechatferryAgentEventMap, WechatferryAgentEventMessage, WechatferryAgentUserOptions } from './types'
import { decodeBytesExtra, getWxidFromBytesExtra, resolvedWechatferryAgentOptions } from './utils'
import type { MSG } from './knex'
import { useMSG0DbQueryBuilder, useMicroMsgDbQueryBuilder } from './knex'

export class WechatferryAgent extends EventEmitter<WechatferryAgentEventMap> {
  private timer: number | null = null
  wcf: Wechatferry
  recipientThrottles: Record<string, (function_: AnyFunction) => ThrottledFunction<AnyFunction>> = {}

  constructor(options: WechatferryAgentUserOptions = {}) {
    super()
    const { wcf }
      = resolvedWechatferryAgentOptions(options)
    this.wcf = wcf
  }

  // #region Core

  /** 是否登录 */
  private get isLoggedIn() {
    try {
      return this.wcf.isLogin()
    }
    catch { }
    return false
  }

  /**
   * 启动 wcf
   */
  start() {
    this.wcf.start()
    this.startTimer()
    this.catchErrors()
    this.wcf.on('message', msg => this.emit('message', msg))
  }

  /**
   * 停止 wcf
   * @param error 要 emit 的错误对象
   */
  stop(error?: any) {
    this.stopTimer()
    if (this.isLoggedIn) {
      this.emit('logout')
    }
    this.wcf.stop()

    if (error) {
      this.emit('error', error)
    }
  }

  private catchErrors() {
    process.on('uncaughtException', this.stop.bind(this))
    process.on('SIGINT', this.stop.bind(this))
    process.on('exit', this.stop.bind(this))
  }

  private checkLogin() {
    if (this.isLoggedIn) {
      const userInfo = this.wcf.getUserInfo()
      this.emit('login', userInfo)
      this.stopTimer()
    }
  }

  private startTimer() {
    this.stopTimer()
    this.checkLogin()

    setInterval(() => {
      if (this.isLoggedIn) {
        return this.stopTimer()
      }
      this.checkLogin()
    }, 5000)
  }

  private stopTimer() {
    clearInterval(this.timer!)
    this.timer = null
  }

  // #endregion

  // #region API

  /**
   * 执行 sql 查询
   *
   * @param db db 名称
   * @param sql sql 语句或 knex 查询构建器
   * @returns 查询结果
   */
  dbSqlQuery<T>(db: string, sql: string | Knex.QueryBuilder): T {
    return this.wcf.execDbQuery(db, typeof sql === 'string' ? sql : sql.toQuery()) as T
  }

  /**
   * 邀请联系人加群
   *
   * @param roomId 群id
   * @param contactId 联系人wxid
   */
  inviteChatRoomMembers(roomId: string, contactId: string | string[]) {
    return this.wcf.inviteRoomMembers(roomId, Array.isArray(contactId) ? contactId : [contactId])
  }

  /**
   * 添加联系人加群
   *
   * @param roomId 群id
   * @param contactId 联系人wxid
   */
  addChatRoomMembers(roomId: string, contactId: string | string[]) {
    return this.wcf.addRoomMembers(roomId, Array.isArray(contactId) ? contactId : [contactId])
  }

  /**
   * 踢出群聊
   *
   * @param roomId 群id
   * @param contactId 群成员wxid
   */
  removeChatRoomMembers(roomId: string, contactId: string | string[]) {
    return this.wcf.delRoomMembers(roomId, Array.isArray(contactId) ? contactId : [contactId])
  }

  /**
   * 发送文本消息
   *
   * @param conversationId 会话id，可以是 wxid 或者 roomid
   * @param text 文本消息
   * @param mentionIdList 要 `@` 的 wxid 列表
   */
  sendText(conversationId: string, text: string, mentionIdList: string[] = []) {
    return this.wcf.sendTxt(text, conversationId, mentionIdList)
  }

  /**
   * 发送图片消息
   *
   * @param conversationId 会话id，可以是 wxid 或者 roomid
   * @param image 图片 fileBox
   */
  sendImage(conversationId: string, image: FileBoxInterface) {
    return this.wcf.sendImg(image, conversationId)
  }

  /**
   * 发送文件消息
   *
   * @param conversationId 会话id，可以是 wxid 或者 roomid
   * @param file 文件 fileBox
   */
  sendFile(conversationId: string, file: FileBoxInterface) {
    return this.wcf.sendFile(file, conversationId)
  }

  /**
   * 发送富文本消息
   *
   * @param conversationId 会话id，可以是 wxid 或者 roomid
   * @param desc 富文本内容
   */
  sendRichText(conversationId: string, desc: Omit<ReturnType<wcf.RichText['toObject']>, 'receiver'>) {
    return this.wcf.sendRichText(desc, conversationId)
  }

  /**
   * 转发消息
   *
   * @param conversationId 会话id，可以是 wxid 或者 roomid
   * @param messageId 要转发的消息 id
   */
  forwardMsg(conversationId: string, messageId: string) {
    return this.wcf.forwardMsg(conversationId, messageId)
  }

  async downloadImage(message: WechatferryAgentEventMessage, timeout = 30) {
    if (this.wcf.downloadAttach(message.id, message.thumb, message.extra) !== 0) {
      throw new Error(`downloadImage(${message}): download image failed`)
    }
    for (let cnt = 0; cnt < timeout; cnt++) {
      const path = this.wcf.decryptImage(message.extra || '', os.tmpdir())
      if (path) {
        return FileBox.fromFile(path)
      }
      await setTimeout(1000)
    }
    throw new Error(`downloadImage(${message}): download image timeout`)
  }

  async downloadFile(message: WechatferryAgentEventMessage) {
    if (this.wcf.downloadAttach(message.id, message.thumb, message.extra) !== 0) {
      throw new Error(`downloadFile(${message}): download file failed`)
    }
    if (message.thumb.endsWith('.mp4')) {
      return FileBox.fromFile(message.thumb)
    }
    return FileBox.fromFile(message.extra)
  }

  // #endregion

  // #region MicroMsg.db
  /**
   * 群聊详细列表
   */
  getChatRoomList() {
    const { db, knex } = useMicroMsgDbQueryBuilder()

    const sql = knex
      .from('ChatRoomInfo')
      .select(
        'Announcement',
        'AnnouncementEditor',
        'AnnouncementPublishTime',
        'InfoVersion',
      )
      .leftJoin('Contact', 'ChatRoomInfo.ChatRoomName', 'Contact.UserName')
      .select(
        knex.ref('NickName').withSchema('Contact'),
        knex.ref('UserName').withSchema('Contact'),
      )
      .leftJoin(
        'ChatRoom',
        'ChatRoomInfo.ChatRoomName',
        'ChatRoom.ChatRoomName',
      )
      .select(knex.ref('Reserved2').withSchema('ChatRoom'))
      .select(knex.ref('UserNameList').withSchema('ChatRoom'))
      .select(knex.ref('DisplayNameList').withSchema('ChatRoom'))
      .leftJoin(
        'ContactHeadImgUrl',
        'Contact.UserName',
        'ContactHeadImgUrl.usrName',
      )
      .select(knex.ref('smallHeadImgUrl').withSchema('ContactHeadImgUrl'))

    const list = this.dbSqlQuery<PromiseReturnType<typeof sql>>(db, sql)

    return list.map(room => this.formatChatRoomInfo(room))
  }

  /**
   * 群聊信息
   * @param userName roomId
   */
  getChatRoomInfo(
    userName: string,
  ) {
    const { db, knex } = useMicroMsgDbQueryBuilder()

    const sql = knex
      .from('ChatRoomInfo')
      .select(
        'Announcement',
        'AnnouncementEditor',
        'AnnouncementPublishTime',
        'InfoVersion',
      )
      .leftJoin('Contact', 'ChatRoomInfo.ChatRoomName', 'Contact.UserName')
      .select(
        knex.ref('NickName').withSchema('Contact'),
        knex.ref('UserName').withSchema('Contact'),
      )
      .leftJoin(
        'ContactHeadImgUrl',
        'Contact.UserName',
        'ContactHeadImgUrl.usrName',
      )
      .select(knex.ref('smallHeadImgUrl').withSchema('ContactHeadImgUrl'))
      .leftJoin(
        'ChatRoom',
        'ChatRoomInfo.ChatRoomName',
        'ChatRoom.ChatRoomName',
      )
      .select(knex.ref('Reserved2').withSchema('ChatRoom'))
      .select(knex.ref('UserNameList').withSchema('ChatRoom'))
      .select(knex.ref('DisplayNameList').withSchema('ChatRoom'))
      .where('ChatRoomInfo.ChatRoomName', userName)

    const [data] = this.dbSqlQuery<PromiseReturnType<typeof sql>>(db, sql)
    if (!data)
      return

    return this.formatChatRoomInfo(data)
  }

  /**
   * 群聊成员
   * @param userName roomId
   */
  getChatRoomMembers(userName: string) {
    const roomInfo = this.getChatRoomInfo(userName)
    if (!roomInfo)
      return
    const { memberIdList, displayNameMap } = roomInfo
    return this.getChatRoomMembersByMemberIdList(memberIdList, displayNameMap)
  }

  /**
   * 群聊成员
   * @param memberIdList 群成员 wxid 列表
   * @param displayNameMap 群成员 wxid 与昵称对照表
   */
  getChatRoomMembersByMemberIdList(memberIdList: string[], displayNameMap: Record<string, string>) {
    const { db, knex } = useMicroMsgDbQueryBuilder()
    const sql = knex
      .from('Contact')
      .select('NickName', 'UserName', 'Remark')
      .whereIn(
        'UserName',
        memberIdList,
      )
      .leftJoin(
        'ContactHeadImgUrl',
        'Contact.UserName',
        'ContactHeadImgUrl.usrName',
      )
      .select(knex.ref('smallHeadImgUrl').withSchema('ContactHeadImgUrl'))
    const results = this.dbSqlQuery<PromiseReturnType<typeof sql>>(db, sql)

    const enrichedResults = results.map(result => ({
      ...result,
      /** 群昵称 */
      DisplayName: displayNameMap[result.UserName] || '',
    }))
    return enrichedResults
  }

  /**
   * 联系人信息
   * @param userName wxid 或 roomId
   */
  getContactInfo(userName: string) {
    const { db, knex } = useMicroMsgDbQueryBuilder()
    const sql = knex.from('Contact')
      .select('NickName', 'UserName', 'Remark', 'Alias', 'PYInitial', 'RemarkPYInitial', 'LabelIDList')
      .leftJoin(
        'ContactHeadImgUrl',
        'Contact.UserName',
        'ContactHeadImgUrl.usrName',
      )
      .select(knex.ref('smallHeadImgUrl').withSchema('ContactHeadImgUrl'))
      .where('UserName', userName)
    const [data] = this.dbSqlQuery<PromiseReturnType<typeof sql>>(db, sql)
    if (!data)
      return
    return {
      ...data,
      tags: data.LabelIDList?.split(',').filter(v => v) ?? [],
    }
  }

  /**
   * 联系人列表
   */
  getContactList() {
    const { db, knex } = useMicroMsgDbQueryBuilder()
    const sql = knex
      .from('Contact')
      .select('NickName', 'UserName', 'Remark', 'Alias', 'PYInitial', 'RemarkPYInitial', 'LabelIDList')
      .leftJoin(
        'ContactHeadImgUrl',
        'Contact.UserName',
        'ContactHeadImgUrl.usrName',
      )
      .select(knex.ref('smallHeadImgUrl').withSchema('ContactHeadImgUrl'))
      .where('VerifyFlag', 0)
      .andWhere(function () {
        this.where('Type', 3).orWhere('Type', '>', 50)
      })
      .andWhere('Type', '!=', 2050)
      .andWhereNot(function () {
        this.whereIn('UserName', ['qmessage', 'tmessage'])
      })
      .andWhereNot('UserName', 'like', '%chatroom%')
      .orderBy('Remark', 'desc')

    const result = this.dbSqlQuery<PromiseReturnType<typeof sql>>(db, sql)

    return result.map((v) => {
      return {
        ...v,
        tags: v?.LabelIDList?.split(',').filter(v => v) ?? [],
      }
    })
  }

  getTagList() {
    const { db, knex } = useMicroMsgDbQueryBuilder()
    const sql = knex.from('ContactLabel')
      .select('LabelID', 'LabelName')

    return this.dbSqlQuery<PromiseReturnType<typeof sql>>(db, sql)
  }

  // #endregion

  // #region MSG0.db

  /**
   * talkerId
   * @description 用于查询聊天记录
   * @param userName wxid 或 roomId
   */
  getTalkerId(userName: string) {
    const { db, knex } = useMSG0DbQueryBuilder()
    const sql = knex
      .with(
        'TalkerId',
        knex.raw(
          'select ROW_NUMBER() over(order by (select 0)) AS TalkerId, * FROM Name2ID',
        ),
      )
      .select('*')
      .from('TalkerId')
      .where('UsrName', userName)

    const [data] = this.dbSqlQuery<{ TalkerId: string }[]>(db, sql)
    if (!data)
      return
    return data.TalkerId
  }

  /**
   * 历史聊天记录
   *
   * @description 建议注入查询条件，不然非常的卡
   * @param userName wxid wxid 或 roomId
   * @param filter 注入查询条件
   */
  getHistoryMessageList(
    userName: string,
    filter?: (sql: Knex.QueryBuilder<MSG>) => void,
  ) {
    const talkerId = this.getTalkerId(userName)
    const { db, knex } = useMSG0DbQueryBuilder()
    const sql = knex
      .from('MSG')
      .select(
        'localId',
        'TalkerId',
        'MsgSvrID',
        'Type',
        'SubType',
        'IsSender',
        'CreateTime',
        'Sequence',
        'StatusEx',
        'FlagEx',
        'Status',
        'MsgServerSeq',
        'MsgSequence',
        'StrTalker',
        'StrContent',
        'BytesExtra',
      )
      .where('TalkerId', talkerId)
      .orderBy('CreateTime', 'desc')

    filter?.(sql)

    const data = this.dbSqlQuery<PromiseReturnType<typeof sql>>(db, sql)
    return data.map((msg) => {
      const BytesExtra = decodeBytesExtra(msg.BytesExtra)
      // fallback to self wxid
      const wxid = getWxidFromBytesExtra(BytesExtra) || this.wcf.getSelfWxid()
      return {
        ...msg,
        talkerWxid: wxid,
      }
    })
  }

  // #region Utils

  private formatChatRoomInfo<T extends { UserNameList: string, DisplayNameList: string, Reserved2: string }>(room: T) {
    const memberIdList = room.UserNameList.split('^G')
    const DisplayNameList = room.DisplayNameList.split('^G')
    const displayNameMap: Record<string, string> = {}
    memberIdList.forEach((memberId: string, index: number) => {
      displayNameMap[memberId] = DisplayNameList[index]
    })
    return {
      ...room,
      /** 群主 */
      ownerUserName: room.Reserved2,
      /** 群成员 wxid 列表 */
      memberIdList,
      /** 群成员昵称列表 */
      DisplayNameList,
      /** 群成员{wxid:昵称}对照表 */
      displayNameMap,
    }
  }

  // #endregion
}
