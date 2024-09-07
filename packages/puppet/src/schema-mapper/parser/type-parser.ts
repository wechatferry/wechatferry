import { WechatMessageType, type WxMsg } from '@wechatferry/core'
import * as PUPPET from 'wechaty-puppet'
import { log } from 'wechaty-puppet'
import type { PuppetMessage } from '../../types'
import type { MessageParser, MessageParserContext } from './parser'

const TypeMappings: { [key: number]: PUPPET.types.Message } = {
  [WechatMessageType.Moment]: PUPPET.types.Message.Post,
  [WechatMessageType.Text]: PUPPET.types.Message.Text,
  [WechatMessageType.Image]: PUPPET.types.Message.Image,
  [WechatMessageType.Voice]: PUPPET.types.Message.Audio,
  [WechatMessageType.Emoticon]: PUPPET.types.Message.Emoticon,
  [WechatMessageType.App]: PUPPET.types.Message.Attachment,
  [WechatMessageType.Location]: PUPPET.types.Message.Location,
  [WechatMessageType.MicroVideo]: PUPPET.types.Message.Video,
  [WechatMessageType.Video]: PUPPET.types.Message.Video,
  [WechatMessageType.Sys]: PUPPET.types.Message.Unknown,
  [WechatMessageType.ShareCard]: PUPPET.types.Message.Contact,
  [WechatMessageType.Recalled]: PUPPET.types.Message.Recalled,
  [WechatMessageType.StatusNotify]: PUPPET.types.Message.Unknown,
  [WechatMessageType.SysNotice]: PUPPET.types.Message.Unknown,
}

export const typeParser: MessageParser = async (message: WxMsg, ret: PuppetMessage, _context: MessageParserContext) => {
  const wechatMessageType = message.type as WechatMessageType

  let type: PUPPET.types.Message | undefined = TypeMappings[wechatMessageType]

  if (!type) {
    log.verbose('typeParser', `unsupported type: ${JSON.stringify(message)}`)

    type = PUPPET.types.Message.Unknown
  }

  ret.type = type

  return ret
}
