import type { Buffer } from 'node:buffer'
import type { UserInfo, Wechatferry, WxMsg } from '@wechatferry/core'
import type { parseBytesExtra } from './utils'

export interface WechatferryAgentEventMap {
  message: [WxMsg]
  login: [user: UserInfo]
  logout: []
  error: [error: Error]
}

export interface WechatferryAgentUserOptions {
  /**
   * wcf core instance
   */
  wcf?: Wechatferry
  /**
   * 登录成功后是否继续检查登录状态
   * @description wcf 目前没有发出 `logout` 事件，且退出登录后 dll 会自动销毁
   * @description 如果你需要 `logout` 事件并且希望手动退出/切换账号后自动重新注入，请设置为 true
   * @description 开启后并在登录成功后，若每隔 30s 都没有收到事件或发送消息就检查一次存活
   * @description 你也可以设置一个数字（单位秒）来设置检查间隔，推荐 10 以上
   * @default false
   */
  keepalive?: boolean | number
}

export interface WechatferryAgentOptions extends Required<WechatferryAgentUserOptions> {

}

export interface WechatferryAgentChatRoomMember {
  displayName: string
  userName: string
  nickName: string
  remark: string
  smallHeadImgUrl: string
}

export interface WechatferryAgentContact {
  tags: string[]
  userName: string
  alias?: string | undefined
  nickName: string
  pinYinInitial: string
  remark: string
  remarkPinYinInitial: string
  labelIdList: string
  smallHeadImgUrl: string
}

export interface WechatferryAgentChatRoom {
  announcement: string
  announcementEditor: string
  announcementPublishTime: string
  infoVersion: string
  nickName: string
  userName: string
  ownerUserName: string
  userNameList: string
  smallHeadImgUrl: string
  memberIdList: string[]
  displayNameList: string[]
  displayNameMap: Record<string, string>
}

export type WechatferryAgentEventMessage = WxMsg
export interface WechatferryAgentDBMessage {
  localId?: number
  talkerId?: number
  msgSvrId: number
  type: number
  subType: number
  isSender: number
  createTime: number
  sequence?: number
  statusEx?: number
  flagEx: number
  status: number
  msgServerSeq: number
  msgSequence: number
  strTalker: string
  strContent: string
  bytesExtra: Buffer
  parsedBytesExtra: ReturnType<typeof parseBytesExtra>
  compressContent: Buffer
  talkerWxid: string
}

export interface WechatferryAgentContactTag {
  labelId: string
  labelName: string
}
