import EventEmitter from 'node:events'
import process from 'node:process'
import { setTimeout } from 'node:timers/promises'
import os from 'node:os'
import { existsSync } from 'node:fs'
import type { Buffer } from 'node:buffer'
import { WechatMessageType, type Wechatferry, type wcf } from '@wechatferry/core'
import { FileBox, type FileBoxInterface } from 'file-box'
import type { Knex } from 'knex'
import { useLogger } from '@wechatferry/logger'
import { debounce } from 'perfect-debounce'
import type { PromiseReturnType, WechatferryAgentEventMap, WechatferryAgentEventMessage, WechatferryAgentUserOptions } from './types'
import { decodeBytesExtra, parseBytesExtra, resolvedWechatferryAgentOptions } from './utils'
import type { MSG } from './knex'
import { useMSG0DbQueryBuilder, useMicroMsgDbQueryBuilder } from './knex'

const logger = useLogger('agent')

export class WechatferryAgent extends EventEmitter<WechatferryAgentEventMap> {
  private intervalId: NodeJS.Timeout | null = null
  /** 是否登录 */
  private isLoggedIn = false
  private isChecking = false
  private aliveCounter = 0

  wcf: Wechatferry

  constructor(options: WechatferryAgentUserOptions = {}) {
    super()
    const { wcf }
      = resolvedWechatferryAgentOptions(options)
    this.wcf = wcf
  }

  // #region Core

  /**
   * 启动 wcf
   */
  start() {
    logger.debug('start')
    logger.start('Starting WechatferryAgent...')
    this.wcf.start()
    this.startLoginCheck()
    this.catchErrors()
    this.wcf.on('message', this.onMessage.bind(this))
    this.wcf.on('sended', this.onSended.bind(this))
    logger.success('WechatferryAgent started')
  }

  /**
   * 停止 wcf
   * @param error 要 emit 的错误对象
   */
  stop(error?: any) {
    logger.debug('stop')
    logger.start('Stopping WechatferryAgent...')
    this.stopLoginCheck()
    if (this.isLoggedIn) {
      this.emit('logout')
    }
    this.wcf.stop()

    if (error) {
      this.emit('error', error)
    }
    logger.success('WechatferryAgent stopped')
  }

  private onMessage(msg: WechatferryAgentEventMessage) {
    this.emit('message', msg)
    // 每条消息保活 10s
    this.setAliveCounter(10)
  }

  private onSended(func: string) {
    if (func === 'FUNC_IS_LOGIN') {
      this.setAliveCounter(this.aliveCounter <= 0 ? 10 : 1)
    }
    else {
      this.setAliveCounter(15)
    }
  }

  // eslint-disable-next-line unicorn/consistent-function-scoping
  private setAliveCounter = debounce((counter: number) => {
    // 最多保活 100s
    this.aliveCounter = Math.min(this.aliveCounter + counter, 100)
  }, 100, { leading: true })

  private catchErrors() {
    process.on('uncaughtException', this.stop.bind(this))
    process.on('SIGINT', this.stop.bind(this))
    process.on('exit', this.stop.bind(this))
  }

  private checkLoginStatus() {
    if (this.isChecking)
      return false
    this.isChecking = true
    const isLoggedIn = this.wcf.isLogin()
    // 只有在登录状态改变时才触发事件
    if (isLoggedIn !== this.isLoggedIn) {
      logger.info(`Login status changed: ${isLoggedIn ? 'logged in' : 'logged out'}`)
      this.isLoggedIn = isLoggedIn
      if (isLoggedIn) {
        this.emit('login', this.wcf.getUserInfo())
      }
      else {
        this.emit('logout')
        this.wcf.resetSdk()
      }
    }
    this.isChecking = false
    return true
  }

  private startLoginCheck(interval = 1000) {
    logger.debug('Starting login check...')
    this.stopLoginCheck()
    this.checkLoginStatus()
    this.intervalId = setInterval(() => {
      this.aliveCounter--
      if (this.isLoggedIn) {
        if (this.aliveCounter <= 0) {
          logger.debug('WechatferryAgent may not be alive, checking...')
          this.checkLoginStatus()
        }
      }
      else {
        this.checkLoginStatus()
      }
    }, interval)
  }

  private stopLoginCheck() {
    logger.debug('Stopping login check...')
    clearInterval(this.intervalId!)
    this.intervalId = null
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
    const query = typeof sql === 'string' ? sql : sql.toQuery()
    logger.debug(`dbSqlQuery(${db}, ${query})`)
    return this.wcf.execDbQuery(db, query) as T
  }

  getDbList() {
    logger.debug('getDbList')
    return this.wcf.getDbNames()
  }

  /**
   * 邀请联系人加群
   *
   * @param roomId 群id
   * @param contactId 联系人wxid
   */
  inviteChatRoomMembers(roomId: string, contactId: string | string[]) {
    logger.debug(`inviteChatRoomMembers(${roomId}, ${contactId})`)
    return this.wcf.inviteRoomMembers(roomId, Array.isArray(contactId) ? contactId : [contactId])
  }

  /**
   * 添加联系人加群
   *
   * @param roomId 群id
   * @param contactId 联系人wxid
   */
  addChatRoomMembers(roomId: string, contactId: string | string[]) {
    logger.debug(`addChatRoomMembers(${roomId}, ${contactId})`)
    return this.wcf.addRoomMembers(roomId, Array.isArray(contactId) ? contactId : [contactId])
  }

  /**
   * 踢出群聊
   *
   * @param roomId 群id
   * @param contactId 群成员wxid
   */
  removeChatRoomMembers(roomId: string, contactId: string | string[]) {
    logger.debug(`removeChatRoomMembers(${roomId}, ${contactId})`)
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
    logger.debug(`sendText(${conversationId}, ${text}, ${mentionIdList})`)
    return this.wcf.sendTxt(text, conversationId, mentionIdList)
  }

  /**
   * 发送图片消息
   *
   * @param conversationId 会话id，可以是 wxid 或者 roomid
   * @param image 图片 fileBox
   */
  sendImage(conversationId: string, image: FileBoxInterface) {
    logger.debug(`sendImage(${conversationId}, ${image})`)
    return this.wcf.sendImg(image, conversationId)
  }

  /**
   * 发送文件消息
   *
   * @param conversationId 会话id，可以是 wxid 或者 roomid
   * @param file 文件 fileBox
   */
  sendFile(conversationId: string, file: FileBoxInterface) {
    logger.debug(`sendFile(${conversationId}, ${file})`)
    return this.wcf.sendFile(file, conversationId)
  }

  /**
   * 发送富文本消息
   *
   * @param conversationId 会话id，可以是 wxid 或者 roomid
   * @param desc 富文本内容
   */
  sendRichText(conversationId: string, desc: Omit<ReturnType<wcf.RichText['toObject']>, 'receiver'>) {
    logger.debug(`sendRichText(${conversationId}, ${desc})`)
    return this.wcf.sendRichText(desc, conversationId)
  }

  /**
   * 转发消息
   *
   * @param conversationId 会话id，可以是 wxid 或者 roomid
   * @param messageId 要转发的消息 id
   */
  forwardMsg(conversationId: string, messageId: string) {
    logger.debug(`forwardMsg(${conversationId}, ${messageId})`)
    return this.wcf.forwardMsg(conversationId, messageId)
  }

  /**
   * 撤回消息
   *
   * @description 你只能撤回自己的消息
   * @param messageId 消息 ID
   */
  revokeMsg(messageId: string) {
    logger.debug(`revokeMsg(${messageId})`)
    return this.wcf.revokeMsg(messageId)
  }

  /**
   * 下载文件
   * @description 下载消息中的视频、文件、语音
   * @param message 消息
   * @param timeout 超时
   */
  async downloadFile(message: WechatferryAgentEventMessage, timeout = 30) {
    logger.debug(`downloadFile(${message}, ${timeout})`)
    switch (message.type) {
      case WechatMessageType.Image:
        return this.downloadImage(message, timeout)
      case WechatMessageType.Video:
      case WechatMessageType.File:
        return this.downloadAttach(message, timeout)
      case WechatMessageType.Voice:
        return this.downloadAudio(message, timeout)
    }
    throw new Error(`downloadFile(${message}): unsupported message type`)
  }

  // #endregion

  // #region MicroMsg.db
  /**
   * 群聊详细列表
   */
  getChatRoomList() {
    logger.debug('getChatRoomList')
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
    logger.debug(`getChatRoomInfo(${userName})`)
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
    logger.debug(`getChatRoomMembers(${userName})`)
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
  getChatRoomMembersByMemberIdList(memberIdList: string[], displayNameMap: Record<string, string> = {}) {
    logger.debug(`getChatRoomMembersByMemberIdList(${memberIdList}, ${displayNameMap})`)
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
    logger.debug(`getContactInfo(${userName})`)
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
    logger.debug('getContactList')
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
    logger.debug('getTagList')
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
    logger.debug(`getTalkerId(${userName})`)
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
   * @param dbNumber 手动指定要查询 MSG 分表，默认为遍历查询所有的 MSG{x}.db，如果指定，但该分表不存在，则查询最后一个分表
   */
  getHistoryMessageList(
    userName: string,
    filter?: (sql: Knex.QueryBuilder<MSG>) => void,
    dbNumber?: number,
  ) {
    logger.debug(`getHistoryMessageList(${userName}, ${filter}, ${dbNumber})`)
    const talkerId = this.getTalkerId(userName)
    const { knex } = useMSG0DbQueryBuilder()
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

    const data = this.dbSqlQueryMSG<PromiseReturnType<typeof sql>>(sql, dbNumber)
    return data.map(this.formatHistoryMessage.bind(this))
  }

  /**
   * 获取自己发送的最后一条消息
   */
  getLastSelfMessage(localId?: number) {
    logger.debug(`getLastSelfMessage(${localId})`)
    const { knex } = useMSG0DbQueryBuilder()
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
      ).where('IsSender', 1).orderBy('CreateTime', 'desc').limit(1)
    if (localId)
      sql.where('localId', localId)
    const data = this.dbSqlQueryMSG<PromiseReturnType<typeof sql>>(sql, -1)[0]
    return this.formatHistoryMessage(data)
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

  private formatHistoryMessage<T extends { BytesExtra: Buffer }>(msg: T) {
    const { BytesExtra, ...message } = msg
    const BytesExtraObj = decodeBytesExtra(msg.BytesExtra)
    const extra = parseBytesExtra(BytesExtraObj)
    return {
      ...message,
      talkerWxid: extra.wxid || this.wcf.getSelfWxid(),
      Extra: extra,
    }
  }

  private dbSqlQueryMSG<T>(sql: string | Knex.QueryBuilder, dbNumber?: number): T {
    const dbs = this.getDbList()
    // MSG0.db, MSG1.db...
    const msgDbs = dbs.filter(db => db.startsWith('MSG'))
    if (dbNumber) {
      const db = msgDbs.find(db => db === `MSG${dbNumber}.db`)
      return this.dbSqlQuery<T>(db || msgDbs.at(-1)!, sql)
    }

    return msgDbs.flatMap(db => this.dbSqlQuery<T>(db, sql)) as T
  }

  /**
   * 下载附件
   */
  private async downloadAttach(message: WechatferryAgentEventMessage, timeout = 30) {
    if (this.wcf.downloadAttach(message.id, message.thumb, message.extra) !== 0) {
      throw new Error(`downloadAttach(${message}): download file failed`)
    }
    const filePath = message.thumb.endsWith('.mp4') ? message.thumb : message.extra
    for (let cnt = 0; cnt < timeout; cnt++) {
      if (existsSync(filePath)) {
        return FileBox.fromFile(filePath)
      }
      await setTimeout(1000)
    }
    throw new Error(`downloadAttach(${message}): download file timeout`)
  }

  /**
   * 下载图片
   */
  private async downloadImage(message: WechatferryAgentEventMessage, timeout = 30) {
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

  /**
   * 下载语音
   */
  private async downloadAudio(message: WechatferryAgentEventMessage, timeout = 30) {
    for (let cnt = 0; cnt < timeout; cnt++) {
      const path = this.wcf.getAudioMsg(message.id, os.tmpdir())
      if (path) {
        return FileBox.fromFile(path)
      }
      await setTimeout(1000)
    }
    throw new Error(`downloadAudio(${message}): download audio timeout`)
  }

  // #endregion
}
