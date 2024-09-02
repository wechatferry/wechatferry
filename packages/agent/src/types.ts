import type { UserInfo, Wechatferry, WxMsg } from '@wechatferry/core'

export interface WechatferryAgentEventMap {
  message: [WxMsg]
  login: [user: UserInfo]
  logout: []
  error: [error: Error]
}

export interface WechatferryAgentUserOptions {
  wcf?: Wechatferry
  /**
   * 安全模式
   *
   * @description 严格限制发送消息的频率，安全模式不保证绝对安全
   *
   * 1. 每分钟的全局消息发送量不超过 40 条。
   * 2. 给同一对象发送消息时的间隔在 1-3 秒之间。
   * 3. 给不同对象发送消息时的间隔在 3-5 秒之间。
   *
   * @default false
   */
  safe?: boolean
}

export interface WechatferryAgentOptions extends Required<WechatferryAgentUserOptions> {

}

export type PromiseReturnType<T> = T extends Promise<infer R> ? R : never
