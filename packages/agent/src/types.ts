import type { UserInfo, Wechatferry, WxMsg } from '@wechatferry/core'

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
   * 安全模式
   *
   * @description 严格限制发送消息的频率，安全模式不保证绝对安全
   *
   * 1. 每分钟最多发送 40 条消息
   * 2. 相同接收人 1-3 秒最多 1 条消息
   * 3. TODO: 不同接收人 3-5 秒最多 1 条消息
   *
   * @default false
   */
  safe?: boolean
}

export interface WechatferryAgentOptions extends Required<WechatferryAgentUserOptions> {

}

export type PromiseReturnType<T> = T extends Promise<infer R> ? R : never
