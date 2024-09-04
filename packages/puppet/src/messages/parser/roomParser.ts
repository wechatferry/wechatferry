import type { WxMsg } from '@wechatferry/core'
import * as PUPPET from 'wechaty-puppet'
import { log } from 'wechaty-puppet'
import { xmlToJson } from '../../utils'
import type { PuppetMessage } from '../../types'
import type { MessageParser, MessageParserContext } from './parser'

export const roomParser: MessageParser = async (message: WxMsg, ret: PuppetMessage, context: MessageParserContext) => {
  if (ret.roomId) {
    context.isRoomMessage = true
    if (ret.type === PUPPET.types.Message.Text) {
      try {
        const xml = await xmlToJson<{ msgsource?: { atuserlist?: string[] } }>(message.xml)
        if (xml?.msgsource?.atuserlist?.length) {
          const mentionIdList = xml.msgsource?.atuserlist?.map(v => v.trim()) || []
          if (mentionIdList.length) {
            const room = ret as PUPPET.payloads.MessageRoom
            room.mentionIdList = mentionIdList
          }
        }
      }
      catch (e) {
        log.error('roomParser', 'error when parse xml: %s', message.xml)
        log.error('roomParser', 'exception %s', (e as Error).stack)
      }
    }
  }

  return ret
}
