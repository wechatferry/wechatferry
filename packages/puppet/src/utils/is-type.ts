import { WechatMessageType } from '@wechatferry/core'

export function isRoomId(id?: string): boolean {
  return id?.endsWith('@chatroom') ?? false
}

export function isContactOfficialId(id?: string): boolean {
  return id?.startsWith('gh_') ?? false
}
export function isContactCorporationId(id?: string): boolean {
  return id?.startsWith('@openim') ?? false
}
export function isRoomOps(type: WechatMessageType) {
  return type === WechatMessageType.SysNotice
    || type === WechatMessageType.Sys
}
