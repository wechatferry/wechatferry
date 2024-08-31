import EventEmitter from 'node:events'
import process from 'node:process'
import type { Wechatferry, wcf } from '@wechatferry/core'
import type { FileBoxInterface } from 'file-box'
import type { Knex } from 'knex'
import type { PromiseReturnType, WechatferryAgentEventMap, WechatferryAgentUserOptions } from './types'
import { decodeBytesExtra, decodeRoomData, getWxidFromBytesExtra, resolvedWechatferryAgentOptions } from './utils'
import type { MSG } from './knex'
import { useMSG0DbQueryBuilder, useMicroMsgDbQueryBuilder } from './knex'

export class WechatferryAgent extends EventEmitter<WechatferryAgentEventMap> {
  private timer: number | null = null
  wcf: Wechatferry

  constructor(options: WechatferryAgentUserOptions = {}) {
    super()
    const { wcf }
      = resolvedWechatferryAgentOptions(options)
    this.wcf = wcf
  }

  private get isLoggedIn() {
    return this.wcf.isLogin()
  }

  // #region Core

  start() {
    this.wcf.start()
    this.startTimer()
    this.catchErrors()
    this.wcf.on('message', msg => this.emit('message', msg))
  }

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

  dbSqlQuery<T>(db: string, sql: string | Knex.QueryBuilder): T {
    return this.wcf.execDbQuery(db, typeof sql === 'string' ? sql : sql.toQuery()) as T
  }

  inviteChatRoomMembers(roomId: string, contactId: string) {
    return this.wcf.inviteRoomMembers(roomId, [contactId])
  }

  addChatRoomMembers(roomId: string, contactId: string) {
    return this.wcf.addRoomMembers(roomId, [contactId])
  }

  removeChatRoomMembers(roomId: string, contactId: string) {
    return this.wcf.delRoomMembers(roomId, [contactId])
  }

  sendText(conversationId: string, text: string, mentionIdList: string[] = []) {
    return this.wcf.sendTxt(text, conversationId, mentionIdList)
  }

  sendImage(conversationId: string, file: FileBoxInterface) {
    return this.wcf.sendImg(file, conversationId)
  }

  sendFile(conversationId: string, file: FileBoxInterface) {
    return this.wcf.sendFile(file, conversationId)
  }

  sendRichText(conversationId: string, desc: Omit<ReturnType<wcf.RichText['toObject']>, 'receiver'>) {
    return this.wcf.sendRichText(desc, conversationId)
  }

  forwardMsg(conversationId: string, messageId: string) {
    return this.wcf.forwardMsg(conversationId, messageId)
  }

  // #endregion

  // #region MicroMsg.db
  /**
   * 群聊详细列表
   */
  getChatRoomDetailList() {
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
      .select(knex.ref('RoomData').withSchema('ChatRoom'))
      .select(knex.ref('Reserved2').withSchema('ChatRoom'))
      .leftJoin(
        'ContactHeadImgUrl',
        'Contact.UserName',
        'ContactHeadImgUrl.usrName',
      )
      .select(knex.ref('smallHeadImgUrl').withSchema('ContactHeadImgUrl'))

    const list = this.dbSqlQuery<PromiseReturnType<typeof sql>>(db, sql)

    return list.map((v) => {
      const RoomData = v.RoomData
      const data = decodeRoomData(RoomData)
      const memberIdList = data.members?.map(m => m.wxid) ?? []
      return {
        ...v,
        ownerUserName: v.Reserved2,
        memberIdList,
      }
    })
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
        knex.ref('userName').withSchema('Contact'),
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
      .select(knex.ref('UserNameList').withSchema('ChatRoom'))
      .select(knex.ref('DisplayNameList').withSchema('ChatRoom'))
      .where('ChatRoomInfo.ChatRoomName', userName)

    const [data] = this.dbSqlQuery<PromiseReturnType<typeof sql>>(db, sql)
    if (!data)
      return
    const memberIdList = data.UserNameList.split('^G')
    const DisplayNameList = data.DisplayNameList.split('^G')
    const displayNameMap: Record<string, string> = {}
    memberIdList.forEach((memberId, index) => {
      displayNameMap[memberId] = DisplayNameList[index]
    })
    return {
      ...data,
      /** 群成员 wxid 列表 */
      memberIdList,
      /** 群成员昵称列表 */
      DisplayNameList,
      /** 群成员{wxid:昵称}对照表 */
      displayNameMap,
    }
  }

  /**
   * 群聊成员
   * @param userName roomId
   */
  // eslint-disable-next-line ts/ban-ts-comment
  // @ts-expect-error
  override getChatRoomMembers(userName: string) {
    const { db, knex } = useMicroMsgDbQueryBuilder()
    const roomInfo = this.getChatRoomInfo(userName)
    if (!roomInfo)
      return
    const { memberIdList, displayNameMap } = roomInfo
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
      .select('NickName', 'UserName', 'Remark', 'PYInitial', 'RemarkPYInitial', 'LabelIDList')
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
      .select('NickName', 'UserName', 'Remark', 'PYInitial', 'RemarkPYInitial', 'LabelIDList')
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
}
