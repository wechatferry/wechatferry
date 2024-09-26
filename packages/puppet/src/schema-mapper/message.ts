import type * as PUPPET from 'wechaty-puppet'
import type { WechatferryAgentDBMessage, WechatferryAgentEventMessage } from '@wechatferry/agent'
import type { PuppetMessage } from '../types'
import { isRoomId } from '../utils'
import { executeMessageParsers } from './parser'

function rewriteMsgContent(message: string) {
  const splitContent = message.split(':\n')
  const content = splitContent.length > 1 ? splitContent[1] : message

  return content
}

export async function wechatferryMessageToWechaty(puppet: PUPPET.Puppet, message: WechatferryAgentEventMessage): Promise<PuppetMessage> {
  let text = message.content
  const roomId = message.is_group ? message.roomid : ''
  const talkerId = message.sender
  const listenerId = message.sender

  if (roomId) {
    text = rewriteMsgContent(text)
  }

  const ret: PuppetMessage = {
    id: message.id.toString(),
    text,
    talkerId,
    listenerId: roomId ? '' : listenerId,
    timestamp: Date.now(),
    roomId,
    isRefer: false,
  } as PuppetMessage

  await executeMessageParsers(puppet, message, ret)

  return ret
}

export function wechatferryDBMessageToWechaty(puppet: PUPPET.Puppet, message: WechatferryAgentDBMessage) {
  return wechatferryMessageToWechaty(puppet, wechatferryDBMessageToEventMessage(message))
}

export function wechatferryDBMessageToEventMessage(message: WechatferryAgentDBMessage) {
  const isRoom = isRoomId(message.strTalker)
  return {
    content: message.strContent,
    extra: message.parsedBytesExtra.extra,
    id: `${message.msgSvrId}`,
    is_group: isRoom,
    is_self: message.isSender === 1,
    roomid: isRoom ? message.strTalker : '',
    sender: `${message.talkerWxid}`,
    ts: message.createTime,
    type: message.type,
    xml: message.parsedBytesExtra.xml,
    sign: message.parsedBytesExtra.sign,
    thumb: message.parsedBytesExtra.thumb,
  } as WechatferryAgentEventMessage
}
