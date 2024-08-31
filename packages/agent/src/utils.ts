import type { Buffer } from 'node:buffer'
import { BytesExtra, RoomData, Wechatferry } from '@wechatferry/core'
import type { WechatferryAgentOptions, WechatferryAgentUserOptions } from './types'

export function resolvedWechatferryAgentOptions(options: WechatferryAgentUserOptions): WechatferryAgentOptions {
  return {
    wcf: new Wechatferry(),
    ...options,
  }
}

export function decodeRoomData(roomData: Buffer) {
  const r = RoomData.deserialize(roomData)
  return r.toObject()
}

export function decodeBytesExtra(bytesExtra: Buffer) {
  const b = BytesExtra.deserialize(bytesExtra)
  return b.toObject()
}

export function getWxidFromBytesExtra(bytesExtra: ReturnType<typeof BytesExtra.prototype.toObject>): null | string {
  const wxidMessage = bytesExtra.message2?.find(
    (item: any) => item.field1 === 1,
  )
  const wxid = wxidMessage?.field2
  if (!wxid)
    return null
  return wxid.split(':')[0]
}
