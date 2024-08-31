import type { WxMsg } from '@wechatferry/core'
import * as PUPPET from 'wechaty-puppet'
import xml2js, { type ParserOptions } from 'xml2js'

async function xmlToJson(xml: string, options?: ParserOptions): Promise<any> {
  const posIdx = xml.indexOf('<')
  if (posIdx !== 0)
    xml = xml.slice(posIdx)
  return xml2js.parseStringPromise(xml, options)
}

async function normalizedMsgType(message: WxMsg) {
  const content = message.content
  let subType = content.match(/<type>(\d+)<\/type>/)?.[1]
    ? String(content.match(/<type>(\d+)<\/type>/)?.[1])
    : '0'
  let type = PUPPET.types.Message.Unknown

  try {
    const json = await xmlToJson(content, {
      explicitArray: false,
      ignoreAttrs: true,
    })

    subType = json.msg.appmsg.type || subType

    switch (subType) {
      case '5': // card link
        type = PUPPET.types.Message.Url
        break
      case '4':
        type = PUPPET.types.Message.Url
        break
      case '1':
        type = PUPPET.types.Message.Url
        break
      case '6': // file
        type = PUPPET.types.Message.Attachment
        break
      case '19':
        type = PUPPET.types.Message.ChatHistory
        break
      case '33':
        type = PUPPET.types.Message.MiniProgram
        break
      case '87':
        type = PUPPET.types.Message.GroupNote
        break
      case '2000':
        type = PUPPET.types.Message.Transfer
        break
      case '2001':
        type = PUPPET.types.Message.RedEnvelope
        break
      case '10002':
        type = PUPPET.types.Message.Recalled
        break
      default:
    }
  }
  catch (err: any) {
    PUPPET.log.error(err)
  }

  return { type, subType }
}

function rewriteMsgContent(message: WxMsg) {
  const splitContent = message.content.split(':\n')
  const content = splitContent.length > 1 ? splitContent[1] : message.content

  return content
}

export async function normalizedMsg(message: WxMsg) {
  let type = PUPPET.types.Message.Unknown
  let content = message.content
  let subType = content.match(/<type>(\d+)<\/type>/)?.[1]
    ? String(content.match(/<type>(\d+)<\/type>/)?.[1])
    : '0'

  content = rewriteMsgContent(message)

  const code = message.type.valueOf()
  switch (code) {
    case 1:
      type = PUPPET.types.Message.Text
      break
    case 3:
      type = PUPPET.types.Message.Image
      break
    case 4:
      type = PUPPET.types.Message.Video
      break
    case 5:
      type = PUPPET.types.Message.Url
      break
    case 34:
      type = PUPPET.types.Message.Audio
      break
    case 37:
      type = PUPPET.types.Message.Contact
      break
    case 40:
      break
    case 42:
      type = PUPPET.types.Message.Contact
      break
    case 43:
      type = PUPPET.types.Message.Video
      break
    case 47:
      type = PUPPET.types.Message.Emoticon
      break
    case 48:
      type = PUPPET.types.Message.Location
      break
    case 49:
    {
      const data = await normalizedMsgType(message)
      type = data.type
      subType = data.subType
      break
    }
    case 50:
      break
    case 51:
      break
    case 52:
      break
    case 53:
      type = PUPPET.types.Message.GroupNote
      break
    case 62:
      break
    case 9999:
      break
    case 10000:
      // room event
      break
    case 10002:
      type = PUPPET.types.Message.Recalled
      break
    case 1000000000:
      type = PUPPET.types.Message.Post
      break
    default:
  }

  return {
    content,
    type,
    subType,
  }
}
