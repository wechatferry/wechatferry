import type { Buffer } from 'node:buffer'
import { BytesExtra, RoomData, Wechatferry } from '@wechatferry/core'
import type { WechatferryAgentOptions, WechatferryAgentUserOptions } from './types'

export function resolvedWechatferryAgentOptions(options: WechatferryAgentUserOptions): WechatferryAgentOptions {
  return {
    wcf: new Wechatferry(),
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

/**
 * 从 bytesExtra 中获取 wxid
 *
 * @param bytesExtra 解码后的 bytesExtra
 * @returns wxid
 */
export function getWxidFromBytesExtra(bytesExtra: ReturnType<typeof BytesExtra.prototype.toObject>): null | string {
  const wxidMessage = bytesExtra.message2?.find(
    (item: any) => item.field1 === 1,
  )
  const wxid = wxidMessage?.field2
  if (!wxid)
    return null
  return wxid.split(':')[0]
}
