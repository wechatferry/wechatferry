import xml2js, { type ParserOptions } from 'xml2js'
import * as PUPPET from 'wechaty-puppet'
import { log } from 'wechaty-puppet'

export async function xmlToJson(xml: string, options?: ParserOptions): Promise<any> {
  const posIdx = xml.indexOf('<')
  if (posIdx !== 0)
    xml = xml.slice(posIdx)
  return xml2js.parseStringPromise(xml, options)
}

export async function xmlDecrypt(xml: string, msgType: PUPPET.types.Message): Promise<any> {
  let res
  log.verbose('PuppetBridge', 'text xml:(%s)', xml)

  const messageJson = await xmlToJson(xml)

  switch (msgType) {
    case PUPPET.types.Message.Attachment:
      break
    case PUPPET.types.Message.Audio:
      break
    case PUPPET.types.Message.Contact: {
      res = messageJson.msg.$.username
      break
    }
    case PUPPET.types.Message.ChatHistory:
      break
    case PUPPET.types.Message.Emoticon:
      break
    case PUPPET.types.Message.Image:
      break
    case PUPPET.types.Message.Text:
      break
    case PUPPET.types.Message.Location: {
      const location: any = messageJson.msg.location[0].$
      const LocationPayload: PUPPET.payloads.Location = {
        accuracy: location.scale, // Estimated horizontal accuracy of this location, radial, in meters. (same as Android & iOS API)
        address: location.label, // "北京市北京市海淀区45 Chengfu Rd"
        latitude: location.x, // 39.995120999999997
        longitude: location.y, // 116.334154
        name: location.poiname, // "东升乡人民政府(海淀区成府路45号)"
      }
      res = LocationPayload
      break
    }
    case PUPPET.types.Message.MiniProgram: {
      const appmsg = messageJson.msg.appmsg[0]
      const MiniProgramPayload: PUPPET.payloads.MiniProgram = {
        appid: appmsg.weappinfo[0].appid[0], // optional, appid, get from wechat (mp.weixin.qq.com)
        description: appmsg.des[0], // optional, mini program title
        iconUrl: appmsg.weappinfo[0].weappiconurl[0], // optional, mini program icon url
        pagePath: appmsg.weappinfo[0].pagepath[0], // optional, mini program page path
        shareId: appmsg.weappinfo[0].shareId[0], // optional, the unique userId for who share this mini program
        thumbKey: appmsg.appattach[0].cdnthumbaeskey[0], // original, thumbnailurl and thumbkey will make the headphoto of mini-program better
        thumbUrl: appmsg.appattach[0].cdnthumburl[0], // optional, default picture, convert to thumbnail
        title: appmsg.title[0], // optional, mini program title
        username: appmsg.weappinfo[0].username[0], // original ID, get from wechat (mp.weixin.qq.com)
      }
      res = MiniProgramPayload
      break
    }
    case PUPPET.types.Message.GroupNote:
      break
    case PUPPET.types.Message.Transfer:
      break
    case PUPPET.types.Message.RedEnvelope:
      break
    case PUPPET.types.Message.Recalled:
      break
    case PUPPET.types.Message.Url: {
      const appmsg = messageJson.msg.appmsg[0]

      const UrlLinkPayload: PUPPET.payloads.UrlLink = {
        description: appmsg.des[0],
        thumbnailUrl: appmsg.appattach[0].cdnthumburl,
        title: appmsg.title[0],
        url: appmsg.url[0],
      }

      res = UrlLinkPayload
      break
    }
    case PUPPET.types.Message.Video:
      break
    case PUPPET.types.Message.Post:
      break
    default:
      res = {}
  }

  return res
}
