import type { Socket } from '@rustup/nng'
import type { wcf } from './proto/wcf'
import type { WechatferrySDK } from './sdk'

export interface WechatferrySDKUserOptions {
  /**
   * dll 文件所在目录
   * @default resolve(__dirname, '../sdk')
   */
  sdkRoot?: string
  /**
   * sdk 端口
   * @default 10086
   */
  port?: number
  /**
   * sdk host
   * @default '127.0.0.1'
   */
  host?: string
  /**
   * 是否启用 dll 的 debug 模式
   * @default false
   */
  debug?: boolean
}

export interface WechatferrySDKOptions extends Required<WechatferrySDKUserOptions> {
}

export interface WechatferryUserOptions {
  /**
   * sdk instance
   */
  sdk?: WechatferrySDK
  /**
   * socket instance
   */
  socket?: Socket
}

export interface WechatferryOptions extends Required<WechatferryUserOptions> {
}

type ToPlainType<T extends { toObject: () => unknown }> = Required<
  ReturnType<T['toObject']>
>

export enum WechatAppMessageType {
  Text = 1,
  Img = 2,
  Audio = 3,
  Video = 4,
  Url = 5,
  Attach = 6,
  Open = 7,
  Emoji = 8,
  VoiceRemind = 9,
  ScanGood = 10,
  Good = 13,
  Emotion = 15,
  CardTicket = 16,
  RealtimeShareLocation = 17,
  ChatHistory = 19,
  MiniProgram = 33,
  MiniProgramApp = 36, // this is forwardable mini program
  Channels = 51, // 视频号
  GroupNote = 53,
  ReferMsg = 57,
  Transfers = 2000,
  RedEnvelopes = 2001,
  ReaderType = 100001,
}

export enum WechatMessageType {
  Moment = 0,
  Text = 1,
  Image = 3,
  Voice = 34,
  VerifyMsg = 37,
  PossibleFriendMsg = 40,
  ShareCard = 42,
  Video = 43,
  Emoticon = 47,
  Location = 48,
  App = 49,
  VoipMsg = 50,
  StatusNotify = 51,
  VoipNotify = 52,
  VoipInvite = 53,
  MicroVideo = 62,
  Transfer = 2000, // 转账
  RedEnvelope = 2001, // 红包
  MiniProgram = 2002, // 小程序
  GroupInvite = 2003, // 群邀请
  File = 2004, // 文件消息
  SysNotice = 9999,
  Sys = 10000,
  Recalled = 10002, // NOTIFY 服务通知
}

export type UserInfo = ToPlainType<wcf.UserInfo>
export type Contact = ToPlainType<wcf.RpcContact>
export type DbTable = ToPlainType<wcf.DbTable>
export interface WxMsg extends ToPlainType<wcf.WxMsg> {
  type: WechatMessageType
}
