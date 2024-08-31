import type { Socket } from '@rustup/nng'
import type { wcf } from './proto/wcf'
import type { WechatferrySDK } from './sdk'

export interface WechatferrySDKUserOptions {
  sdkRoot?: string
  port?: number
  host?: string
  debug?: boolean
}

export interface WechatferrySDKOptions extends Required<WechatferrySDKUserOptions> {
}

export interface WechatferryUserOptions {
  sdk?: WechatferrySDK
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
