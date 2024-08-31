import { EventEmitter } from 'node:events'
import process, { nextTick } from 'node:process'
import { Buffer } from 'node:buffer'
import type { MessageRecvDisposable } from '@rustup/nng'
import { Socket } from '@rustup/nng'
import type { FileBox, FileBoxInterface } from 'file-box'
import { remove } from 'fs-extra'
import { WechatferrySDK } from './sdk'
import { wcf } from './proto/wcf'
import type { Contact, DbTable, UserInfo, WechatferryOptions, WechatferryUserOptions, WxMsg } from './types'
import { parseDbField, saveFileBox } from './utils'

export function resolvedWechatferryOptions(options: WechatferryUserOptions): WechatferryOptions {
  return {
    ...options,
    socket: new Socket(),
    sdk: new WechatferrySDK(),
  }
}

export interface WechatferryEventMap {
  message: [WxMsg]
}

export class Wechatferry extends EventEmitter<WechatferryEventMap> {
  sdk: WechatferrySDK
  socket: Socket
  messageRecvDisposable?: MessageRecvDisposable

  constructor(options: WechatferryUserOptions = {}) {
    super()
    const { sdk, socket } = resolvedWechatferryOptions(options)
    this.sdk = sdk
    this.socket = socket
  }

  // #region Core

  start() {
    this.catchErrors()
    this.sdk.init()
    this.socket.connect(this.sdk.cmdUrl)
    this.sdk.on('message', msg => this.emit('message', msg.toObject() as WxMsg))
    this.startRecvMessage()
  }

  stop() {
    this.stopRecvMessage()
    this.socket.close()
    this.sdk.destroy()
  }

  startRecvMessage() {
    if (this.sdk.isReceiving)
      return
    const { status } = this.send(new wcf.Request({
      func: wcf.Functions.FUNC_ENABLE_RECV_TXT,
      flag: true,
    }))
    if (status !== 0) {
      this.sdk.stopRecvMessage()
    }
    this.sdk.startRecvMessage()
    return status
  }

  stopRecvMessage() {
    if (!this.sdk.isReceiving)
      return
    const { status } = this.send(new wcf.Request({
      func: wcf.Functions.FUNC_DISABLE_RECV_TXT,
    }))
    this.sdk.stopRecvMessage()
    return status
  }

  send(req: wcf.Request): wcf.Response {
    const buf = this.socket.send(Buffer.from(req.serialize()))
    return wcf.Response.deserialize(buf)
  }

  private catchErrors() {
    process.on('uncaughtException', this.stop.bind(this))
    process.on('SIGINT', this.stop.bind(this))
    process.on('exit', this.stop.bind(this))
  }

  // #endregion

  // #region API

  /** 是否登录 */
  isLogin() {
    const { status } = this.send(new wcf.Request({
      func: wcf.Functions.FUNC_IS_LOGIN,
    }))
    return status === 1
  }

  /** 登录用户 wxid */
  getSelfWxid() {
    const { str } = this.send(new wcf.Request({
      func: wcf.Functions.FUNC_GET_SELF_WXID,
    }))
    return str
  }

  /** 消息类型 */
  getMsgTypes() {
    const { types } = this.send(new wcf.Request({
      func: wcf.Functions.FUNC_GET_MSG_TYPES,
    }))
    return types.types
  }

  /** 联系人 */
  getContacts() {
    const { contacts } = this.send(new wcf.Request({
      func: wcf.Functions.FUNC_GET_CONTACTS,
    }))
    return contacts.contacts.map(v => v.toObject() as Contact)
  }

  /** 数据库列表 */
  getDbNames() {
    const { dbs } = this.send(new wcf.Request({
      func: wcf.Functions.FUNC_GET_DB_NAMES,
    }))
    return dbs.names
  }

  /**
   * 数据库表列表
   *
   * @param db 数据库名称
   */
  getDbTables(db: string) {
    const { tables } = this.send(new wcf.Request({
      func: wcf.Functions.FUNC_GET_DB_TABLES,
      str: db,
    }))
    return tables.tables.map(v => v.toObject() as DbTable)
  }

  /**
   * 用户信息
   *
   * @deprecated Not supported
   */
  getUserInfo() {
    const { ui } = this.send(new wcf.Request({
      func: wcf.Functions.FUNC_GET_USER_INFO,
    }))
    return ui.toObject() as UserInfo
  }

  /**
   * 获取语音消息并转成 MP3
   *
   * @param id 消息 id
   * @param dir MP3 保存目录（目录不存在会出错）
   * @returns 成功返回存储路径
   */
  getAudioMsg(id: string, dir: string) {
    const { str } = this.send(new wcf.Request({
      func: wcf.Functions.FUNC_GET_AUDIO_MSG,
      am: new wcf.AudioMsg({
        id,
        dir,
      }),
    }))

    return str
  }

  /**
   * 发送文本消息
   * @param msg 要发送的消息，换行使用 `\n` （单杠）；如果 @ 人的话，需要带上跟 `aters` 里数量相同的 @
   * @param receiver 消息接收人，wxid 或者 roomId
   * @param mentions 要 @ 的 wxid，多个用逗号分隔；`@所有人` 只需要 `notify@all`
   * @returns 0 为成功，其他失败
   */
  sendTxt(msg: string, receiver: string, mentions: string[] = []) {
    const req = new wcf.Request({
      func: wcf.Functions.FUNC_SEND_TXT,
      txt: new wcf.TextMsg({
        msg,
        receiver,
        aters: mentions?.join(','),
      }),
    })
    const { status } = this.send(req)
    return status
  }

  /**
   * 发送图片消息
   *
   * @param image 图片文件
   * @param receiver 消息接收人，wxid 或者 roomId
   * @returns 0 为成功，其他失败
   */
  async sendImg(image: FileBoxInterface, receiver: string) {
    const path = await saveFileBox(image)
    const req = new wcf.Request({
      func: wcf.Functions.FUNC_SEND_IMG,
      file: new wcf.PathMsg({
        receiver,
        path,
      }),
    })
    const { status } = this.send(req)
    nextTick(() => {
      void remove(path)
    })
    return status
  }

  /**
   * 发送文件消息
   *
   * @param file 图片文件
   * @param receiver 消息接收人，wxid 或者 roomId
   * @returns 0 为成功，其他失败
   */
  async sendFile(file: FileBoxInterface, receiver: string) {
    const path = await saveFileBox(file)
    const req = new wcf.Request({
      func: wcf.Functions.FUNC_SEND_FILE,
      file: new wcf.PathMsg({
        receiver,
        path,
      }),
    })
    const { status } = this.send(req)
    nextTick(() => {
      void remove(path)
    })
    return status
  }

  /**
   * 发送 XML 消息
   *
   * @deprecated Not supported
   */
  sendXml(
    xml: Omit<ReturnType<wcf.XmlMsg['toObject']>, 'receiver'>,
    receiver: string,
  ) {
    const req = new wcf.Request({
      func: wcf.Functions.FUNC_SEND_XML,
      xml: new wcf.XmlMsg({
        receiver,
        content: xml.content,
        type: xml.type,
        path: xml.path,
      }),
    })
    const { status } = this.send(req)
    return status
  }

  /**
   * 发送表情消息
   * @param emotion 表情路径
   * @param receiver 消息接收人，wxid 或者 roomId
   * @returns 0 为成功，其他失败
   */
  async sendEmotion(emotion: FileBox, receiver: string) {
    const path = await saveFileBox(emotion)
    const req = new wcf.Request({
      func: wcf.Functions.FUNC_SEND_EMOTION,
      file: new wcf.PathMsg({
        path,
        receiver,
      }),
    })
    const { status } = this.send(req)
    return status
  }

  /**
   * 发送富文本消息
   *  卡片样式：
   *```md
   * |--------------------------------------|
   * | title， 最长两行                       |
   * | (长标题， 标题短的话这行没有)             |
   * | digest, 最多三行，会占位    |--------|  |
   * | digest, 最多三行，会占位    |thumburl|  |
   * | digest, 最多三行，会占位    |--------|  |
   * | (account logo) name                  |
   * |--------------------------------------|
   *```
   * @param desc 富文本
   * @param desc.name 左下显示的名字
   * @param desc.account 填公众号 id 可以显示对应的头像（gh_ 开头的）
   * @param desc.title 标题，最多两行
   * @param desc.digest 摘要，三行
   * @param desc.url 点击后跳转的链接
   * @param desc.thumburl 缩略图的链接
   * @param receiver 接收人, wxid 或者 roomId
   * @returns 0 为成功，其他失败
   */
  sendRichText(
    desc: Omit<ReturnType<wcf.RichText['toObject']>, 'receiver'>,
    receiver: string,
  ) {
    const req = new wcf.Request({
      func: wcf.Functions.FUNC_SEND_RICH_TXT,
      rt: new wcf.RichText({
        ...desc,
        receiver,
      }),
    })
    const { status } = this.send(req)
    return status
  }

  /**
   * 拍一拍群友
   * @param roomId 群 id
   * @param wxid 要拍的群友的 wxid
   * @returns 1 为成功，其他失败
   */
  sendPatMsg(roomId: string, wxid: string) {
    const req = new wcf.Request({
      func: wcf.Functions.FUNC_SEND_PAT_MSG,
      pm: new wcf.PatMsg({
        roomid: roomId,
        wxid,
      }),
    })
    const { status } = this.send(req)
    return status
  }

  /**
   * 转发消息
   * @description 可以转发文本、图片、表情、甚至各种 XML；语音也行，不过效果嘛，自己验证吧。
   * @param id (uint64 in string format): 消息 id
   * @param receiver string 消息接收人，wxid 或者 roomId
   * @returns 1 为成功，其他失败
   */
  forwardMsg(id: string, receiver: string) {
    const req = new wcf.Request({
      func: wcf.Functions.FUNC_FORWARD_MSG,
      fm: new wcf.ForwardMsg({
        id,
        receiver,
      }),
    })
    const { status } = this.send(req)
    return status
  }

  /**
   * 执行 SQL 查询
   * @param db 数据库名
   * @param sql SQL 语句
   */
  execDbQuery(db: string, sql: string) {
    const req = new wcf.Request({
      func: wcf.Functions.FUNC_EXEC_DB_QUERY,
      query: new wcf.DbQuery({ db, sql }),
    })
    const rsp = this.send(req)
    const rows = rsp.rows.rows
    return rows.map(r =>
      Object.fromEntries(
        r.fields.map(f => [f.column, parseDbField(f.type, f.content)]),
      ),
    )
  }

  /**
   * 通过好友申请
   * @deprecated Not supported
   * @param v3 加密用户名 (好友申请消息里 v3 开头的字符串)
   * @param v4 Ticket (好友申请消息里 v4 开头的字符串)
   * @param scene 申请方式 (好友申请消息里的 scene); 为了兼容旧接口，默认为扫码添加 (30)
   * @returns 1 为成功，其他失败
   */
  acceptFriend(v3: string, v4: string, scene = 30) {
    const req = new wcf.Request({
      func: wcf.Functions.FUNC_ACCEPT_FRIEND,
      v: new wcf.Verification({
        v3,
        v4,
        scene,
      }),
    })
    const { status } = this.send(req)
    return status
  }

  /**
   * 接收转账
   * @param wxid 转账消息里的发送人 wxid
   * @param transferId 转账消息里的 transferId
   * @param transactionId 转账消息里的 transactionId
   * @returns 1 为成功，其他失败
   */
  receiveTransfer(
    wxid: string,
    transferId: string,
    transactionId: string,
  ): number {
    const req = new wcf.Request({
      func: wcf.Functions.FUNC_RECV_TRANSFER,
      tf: new wcf.Transfer({
        wxid,
        tfid: transferId,
        taid: transactionId,
      }),
    })
    const { status } = this.send(req)
    return status
  }

  /**
   * 刷新朋友圈
   * @param id 开始 id，0 为最新页 (string based uint64)
   * @returns 1 为成功，其他失败
   */
  refreshPyq(id: string): number {
    const req = new wcf.Request({
      func: wcf.Functions.FUNC_REFRESH_PYQ,
      ui64: id,
    })
    const { status } = this.send(req)
    return status
  }

  /**
   * 下载附件（图片、视频、文件
   * @param id 消息中 id
   * @param thumb 消息中的 thumb
   * @param extra 消息中的 extra
   * @returns 0 为成功, 其他失败。
   */
  downloadAttach(
    id: string,
    thumb: string = '',
    extra: string = '',
  ): number {
    const req = new wcf.Request({
      func: wcf.Functions.FUNC_DOWNLOAD_ATTACH,
      att: new wcf.AttachMsg({
        id,
        thumb,
        extra,
      }),

    })
    const { status } = this.send(req)
    return status
  }

  /**
   * 联系人信息
   *
   * @param wxid 联系人 wxid
   */
  getContactInfo(wxid: string) {
    const req = new wcf.Request({
      func: wcf.Functions.FUNC_GET_CONTACT_INFO,
      str: wxid,
    })
    const { contacts: { contacts: [contact] } } = this.send(req)
    return contact?.toObject()
  }

  /**
   * 撤回消息
   * @param id 消息 id
   * @returns int: 1 为成功，其他失败
   */
  revokeMsg(id: string) {
    const req = new wcf.Request({
      func: wcf.Functions.FUNC_REVOKE_MSG,
      ui64: id,
    })
    const { status } = this.send(req)
    return status
  }

  /**
   * 获取登录二维码，已经登录则返回空字符串
   *
   * @deprecated Not supported
   */
  refreshQrcode() {
    const req = new wcf.Request({
      func: wcf.Functions.FUNC_REFRESH_QRCODE,
    })
    const { str } = this.send(req)
    return str
  }

  /**
   * 解密图片
   *
   * @param src 加密的图片路径
   * @param dir 保存图片的目录
   * @returns 成功返回存储路径；空字符串为失败，原因见日志。
   */
  decryptImage(src: string, dir: string) {
    const req = new wcf.Request({
      func: wcf.Functions.FUNC_DECRYPT_IMAGE,
      dec: new wcf.DecPath({
        src,
        dst: dir,
      }),
    })
    const { str } = this.send(req)
    return str
  }

  /**
   * 获取 OCR 结果
   * @description 鸡肋，需要图片能自动下载；通过下载接口下载的图片无法识别。
   * @param extra 待识别的图片路径，消息里的 extra
   * @returns OCR 结果
   */
  execOCR(extra: string) {
    const req = new wcf.Request({
      func: wcf.Functions.FUNC_EXEC_OCR,
      str: extra,
    })
    const rsp = this.send(req)
    if (rsp.ocr.status === 0 && rsp.ocr.result) {
      return rsp.ocr.result
    }
  }

  /**
   * 添加群成员
   * @param roomId 群 id
   * @param wxidList 要添加的 wxid 列表
   * @returns 1 为成功，其他失败
   */
  addRoomMembers(roomId: string, wxidList: string[]) {
    const req = new wcf.Request({
      func: wcf.Functions.FUNC_ADD_ROOM_MEMBERS,
      m: new wcf.MemberMgmt({
        roomid: roomId,
        wxids: wxidList.join(',').replaceAll(' ', ''),
      }),
    })
    const { status } = this.send(req)
    return status
  }

  /**
   * 删除群成员
   * @param roomId 群 id
   * @param wxidList 要删除的 wxid 列表
   * @returns int32 1 为成功，其他失败
   */
  delRoomMembers(roomId: string, wxidList: string[]) {
    const req = new wcf.Request({
      func: wcf.Functions.FUNC_DEL_ROOM_MEMBERS,
      m: new wcf.MemberMgmt({
        roomid: roomId,
        wxids: wxidList.join(',').replaceAll(' ', ''),
      }),
    })
    const { status } = this.send(req)
    return status
  }

  /**
   * 邀请群成员
   * @param roomId 群 id
   * @param wxidList 要邀请的 wxid 列表
   * @returns int32 1 为成功，其他失败
   */
  inviteRoomMembers(roomId: string, wxidList: string[]) {
    const req = new wcf.Request({
      func: wcf.Functions.FUNC_INV_ROOM_MEMBERS,
      m: new wcf.MemberMgmt({
        roomid: roomId,
        wxids: wxidList.join(',').replaceAll(' ', ''),
      }),
    })
    const { status } = this.send(req)
    return status
  }

  // #endregion

  // #region Utils
}
