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

export type UserInfo = ToPlainType<wcf.UserInfo>
export type Contact = ToPlainType<wcf.RpcContact>
export type DbTable = ToPlainType<wcf.DbTable>
export type WxMsg = ToPlainType<wcf.WxMsg>
