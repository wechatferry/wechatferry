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
  const selfId = puppet.currentUserId
  const roomId = message.is_group ? message.roomid : ''
  const fromId = message.sender
  const toId = message.is_self ? message.roomid : selfId

  if (roomId) {
    text = rewriteMsgContent(text)
  }

  const ret: PuppetMessage = {
    id: message.id.toString(),
    text,
    talkerId: fromId,
    listenerId: roomId ? '' : toId,
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
  const isSelf = message.isSender === 1
  // 若是群聊，则发送人是 message.talkerWxid
  // 若是私聊，且是自己，则发送人是 message.talkerWxid，否则发送人是 message.strTalker
  const senderId = isRoom ? message.talkerWxid
    : (isSelf ? message.talkerWxid : message.strTalker)

  return {
    content: message.strContent,
    extra: message.parsedBytesExtra.extra,
    id: `${message.msgSvrId}`,
    is_group: isRoom,
    is_self: isSelf,
    roomid: message.strTalker,
    sender: senderId,
    ts: message.createTime,
    type: message.type,
    xml: message.parsedBytesExtra.xml,
    sign: message.parsedBytesExtra.sign,
    thumb: message.parsedBytesExtra.thumb,
  } as WechatferryAgentEventMessage
}
