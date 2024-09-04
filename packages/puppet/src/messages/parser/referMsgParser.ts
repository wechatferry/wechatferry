import type { WxMsg } from '@wechatferry/core'
import { WechatAppMessageType, WechatMessageType } from '@wechatferry/core'
import * as PUPPET from 'wechaty-puppet'
import { type ReferMsgPayload, parseAppmsgMessagePayload } from '../appmsg'
import type { PuppetMessage } from '../../types'
import type { MessageParser, MessageParserContext } from './parser'

export const referMsgParser: MessageParser = async (_webMessageRawPayload: WxMsg, ret: PuppetMessage, context: MessageParserContext) => {
  if (!context.appMessagePayload || context.appMessagePayload.type !== WechatAppMessageType.ReferMsg) {
    return ret
  }

  const appPayload = context.appMessagePayload

  let referMessageContent: string

  const referMessagePayload: ReferMsgPayload = appPayload.refermsg!
  const referMessageType = Number.parseInt(referMessagePayload.type) as WechatMessageType
  switch (referMessageType) {
    case WechatMessageType.Text:
      referMessageContent = referMessagePayload.content
      break
    case WechatMessageType.Image:
      referMessageContent = '图片'
      break

    case WechatMessageType.Video:
      referMessageContent = '视频'
      break

    case WechatMessageType.Emoticon:
      referMessageContent = '动画表情'
      break

    case WechatMessageType.Location:
      referMessageContent = '位置'
      break

    case WechatMessageType.App: {
      const referMessageAppPayload = await parseAppmsgMessagePayload(referMessagePayload.content)
      referMessageContent = referMessageAppPayload.title
      break
    }

    default:
      referMessageContent = '未知消息'
      break
  }

  ret.isRefer = true
  ret.type = PUPPET.types.Message.Text
  ret.text = `「${referMessagePayload.displayname}：${referMessageContent}」\n- - - - - - - - - - - - - - -\n${appPayload.title}`

  return ret
}
