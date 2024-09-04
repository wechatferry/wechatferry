import * as PUPPET from 'wechaty-puppet'
import { log } from 'wechaty-puppet'
import { WechatAppMessageType, type WxMsg } from '@wechatferry/core'
import { parseAppmsgMessagePayload } from '../appmsg'
import type { PuppetMessage } from '../../types'
import type { MessageParser, MessageParserContext } from './parser'

export const appMsgParser: MessageParser = async (message: WxMsg, ret: PuppetMessage, context: MessageParserContext) => {
  if (ret.type !== PUPPET.types.Message.Attachment) {
    return ret
  }

  try {
    const appPayload = await parseAppmsgMessagePayload(message.content)
    context.appMessagePayload = appPayload
    switch (appPayload.type) {
      case WechatAppMessageType.Text:
        ret.type = PUPPET.types.Message.Text
        ret.text = appPayload.title
        break
      case WechatAppMessageType.Audio:
        ret.type = PUPPET.types.Message.Url
        break
      case WechatAppMessageType.Video:
        ret.type = PUPPET.types.Message.Url
        break
      case WechatAppMessageType.Url:
        ret.type = PUPPET.types.Message.Url
        break
      case WechatAppMessageType.Attach:
        ret.type = PUPPET.types.Message.Attachment
        ret.filename = appPayload.title
        break
      case WechatAppMessageType.ChatHistory:
        ret.type = PUPPET.types.Message.ChatHistory
        break
      case WechatAppMessageType.MiniProgram:
      case WechatAppMessageType.MiniProgramApp:
        ret.type = PUPPET.types.Message.MiniProgram
        break
      case WechatAppMessageType.RedEnvelopes:
        ret.type = PUPPET.types.Message.RedEnvelope
        break
      case WechatAppMessageType.Transfers:
        ret.type = PUPPET.types.Message.Transfer
        break
      case WechatAppMessageType.RealtimeShareLocation:
        ret.type = PUPPET.types.Message.Location
        break
      case WechatAppMessageType.Channels:
        ret.type = PUPPET.types.Message.Post
        ret.text = appPayload.title
        break
      case WechatAppMessageType.GroupNote:
        ret.type = PUPPET.types.Message.GroupNote
        ret.text = appPayload.title
        break
      default:
        ret.type = PUPPET.types.Message.Unknown
        break
    }
  }
  catch (e) {
    log.warn('appMsgParser', `Error occurred while parse message attachment: ${JSON.stringify(message)} , ${(e as Error).stack}`)
  }

  return ret
}
