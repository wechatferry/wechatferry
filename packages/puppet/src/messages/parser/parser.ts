import type * as PUPPET from 'wechaty-puppet'
import type { WxMsg } from '@wechatferry/core'
import type { AppMessagePayload } from '../appmsg'
import type { PuppetMessage } from '../../types'

export interface MessageParserContext {
  puppet: PUPPET.Puppet
  isRoomMessage: boolean
  appMessagePayload?: AppMessagePayload
}

export type MessageParser = (message: WxMsg, ret: PuppetMessage, context: MessageParserContext) => Promise<PuppetMessage>

const messageParserList: Array<MessageParser> = []

export function addMessageParser(parser: MessageParser) {
  messageParserList.push(parser)
}

export async function executeMessageParsers(puppet: PUPPET.Puppet, message: WxMsg, ret: PuppetMessage): Promise<PuppetMessage> {
  const context: MessageParserContext = {
    isRoomMessage: !!ret.roomId,
    puppet,
  }

  for (const parser of messageParserList) {
    ret = await parser(message, ret, context)
  }

  return ret
}
