import type { Buffer } from 'node:buffer'
import { BytesExtra, RoomData, Wechatferry } from '@wechatferry/core'
import type { WechatferryAgentOptions, WechatferryAgentUserOptions } from './types'

export function resolvedWechatferryAgentOptions(options: WechatferryAgentUserOptions): WechatferryAgentOptions {
  return {
    wcf: new Wechatferry(),
    keepalive: false,
    ...options,
  }
}

/**
 * 解码 RoomData
 *
 * @param roomData roomData
 * @returns 解码后 JSON 对象
 */
export function decodeRoomData(roomData: Buffer) {
  const r = RoomData.deserialize(roomData)
  return r.toObject()
}

/**
 * 解码 BytesExtra
 *
 * @param bytesExtra bytesExtra
 * @returns 解码后 JSON 对象
 */
export function decodeBytesExtra(bytesExtra: Buffer) {
  const b = BytesExtra.deserialize(bytesExtra)
  return b.toObject()
}

export function parseBytesExtra(bytesExtra: ReturnType<typeof BytesExtra.prototype.toObject>) {
  const propertyMap: Partial<
    Record<BytesExtra.PropertyKey, string>
  > = Object.fromEntries(bytesExtra.properties?.map(p => [p.type, p.value]) ?? [])
  const extra = propertyMap[BytesExtra.PropertyKey.EXTRA] ?? ''
  const thumb = propertyMap[BytesExtra.PropertyKey.THUMB] ?? ''
  const wxid = propertyMap[BytesExtra.PropertyKey.WXID] ?? ''
  const sign = propertyMap[BytesExtra.PropertyKey.SIGN] ?? ''
  const xml = propertyMap[BytesExtra.PropertyKey.XML] ?? ''
  return {
    extra,
    thumb,
    wxid: wxid.split(':')[0],
    sign,
    xml,
  }
}
