import type { UserInfo, Wechatferry, WxMsg } from '@wechatferry/core'

export interface WechatferryAgentEventMap {
  message: [WxMsg]
  login: [user: UserInfo]
  logout: []
  error: [error: Error]
}

export interface WechatferryAgentUserOptions {
  wcf?: Wechatferry
}

export interface WechatferryAgentOptions extends Required<WechatferryAgentUserOptions> {

}

export type PromiseReturnType<T> = T extends Promise<infer R> ? R : never
