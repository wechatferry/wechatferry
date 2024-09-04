import type * as PUPPET from 'wechaty-puppet'
import { xmlToJson } from '../utils'

interface EmotionXmlSchema {
  msg: {
    emoji: {
      $: {
        type: string
        len: string
        cdnurl: string
        width: string
        height: string
        md5: string
      }
    }
    gameext: {
      $: {
        content: string
        type: string
      }
    }
  }
}

export interface EmojiMessagePayload {
  type: number
  len: number
  md5: string
  cdnurl: string
  width: number
  height: number
  gameext?: string
}

export async function parseEmotionMessagePayload(message: PUPPET.payloads.Message): Promise<EmojiMessagePayload> {
  const jsonPayload: EmotionXmlSchema = await xmlToJson(message.text ?? '')

  const len = Number.parseInt(jsonPayload.msg.emoji.$.len, 10) || 0
  const width = Number.parseInt(jsonPayload.msg.emoji.$.width, 10) || 0
  const height = Number.parseInt(jsonPayload.msg.emoji.$.height, 10) || 0
  const cdnurl = jsonPayload.msg.emoji.$.cdnurl
  const type = Number.parseInt(jsonPayload.msg.emoji.$.type, 10) || 0
  const md5 = jsonPayload.msg.emoji.$.md5

  let gameext
  if (jsonPayload.msg.gameext) {
    const gameextType = Number.parseInt(jsonPayload.msg.gameext.$.type, 10) || 0
    const gameextContent = Number.parseInt(jsonPayload.msg.gameext.$.content, 10) || 0
    gameext = `<gameext type="${gameextType}" content="${gameextContent}" ></gameext>`
  }

  return {
    cdnurl,
    gameext,
    height,
    len,
    md5,
    type,
    width,
  }
}
