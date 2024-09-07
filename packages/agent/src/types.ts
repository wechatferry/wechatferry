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
}

export interface WechatferryAgentOptions extends Required<WechatferryAgentUserOptions> {

}

export type PromiseReturnType<T> = T extends Promise<infer R> ? R : never

export type WechatferryAgentChatRoomMember = Exclude<ReturnType<WechatferryAgent['getChatRoomMembers']>, undefined>[number]
export type WechatferryAgentContact = Exclude<ReturnType<WechatferryAgent['getContactInfo']>, undefined>
export type WechatferryAgentChatRoom = Exclude<ReturnType<WechatferryAgent['getChatRoomInfo']>, undefined>
export type WechatferryAgentEventMessage = WxMsg
