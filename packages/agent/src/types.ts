import type { UserInfo, Wechatferry, WxMsg } from '@wechatferry/core'
import type { WechatferryAgent } from './agent'

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

export type PromiseReturnType<T> = T extends Promise<infer R> ? R : never

export type WechatferryAgentChatRoomMember = Exclude<ReturnType<WechatferryAgent['getChatRoomMembers']>, undefined>[number]
export type WechatferryAgentContact = Exclude<ReturnType<WechatferryAgent['getContactInfo']>, undefined>
export type WechatferryAgentChatRoom = Exclude<ReturnType<WechatferryAgent['getChatRoomInfo']>, undefined>
export type WechatferryAgentEventMessage = WxMsg
export type WechatferryAgentDBMessage = Exclude<ReturnType<WechatferryAgent['getLastSelfMessage']>, undefined>
