import type * as PUPPET from 'wechaty-puppet'
import type { WechatferryAgentEventMessage } from '@wechatferry/agent'
import type { PuppetMessage } from '../types'
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
