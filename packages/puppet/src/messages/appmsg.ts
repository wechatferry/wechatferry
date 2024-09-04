import type { WechatAppMessageType, WechatMessageType } from '@wechatferry/core'
import { xmlToJson } from '../utils'

interface AppMsgXmlSchema {
  msg: {
    appinfo: {
      appname: string
      version: string
    }
    appmsg: {
      title: string
      des: string
      type: string
      url: string
      appattach: {
        totallen: string
        attachid: string
        emoticonmd5: string
        fileext: string
        cdnattachurl: string
        cdnthumbaeskey: string
        aeskey: string
        encryver: string
        islargefilemsg: string
      }
      thumburl: string
      md5: any
      recorditem?: string
      weappinfo?: {
        username: string
        appid: string
        pagepath: string
        weappiconurl: string
        shareId: string
      }
      refermsg?: {
        type: string
        svrid: string
        fromusr: string
        chatusr: string
        displayname: string
        content: string
      }
      finderFeed?: {
        objectId: string
        feedType: string
        nickname: string
        avatar: string
        desc: string
        mediaCount: string
        objectNonceId: string
        liveId: string
        username: string
        authIconUrl: string
        authIconType: string
        mediaList?: {
          media?: {
            thumbUrl: string
            fullCoverUrl: string
            videoPlayDuration: string
            url: string
            height: string
            mediaType: string
            width: string
          }
        }
        megaVideo?: object
        bizAuthIconType: string
      }
    }
    commenturl: string
    fromusername: string
    scene: string

  }
}

export interface AppAttachPayload {
  totallen?: number
  attachid?: string
  emoticonmd5?: string
  fileext?: string
  cdnattachurl?: string
  aeskey?: string
  cdnthumbaeskey?: string
  encryver?: number
  islargefilemsg: number
}

export interface ReferMsgPayload {
  type: string
  svrid: string
  fromusr: string
  chatusr: string
  displayname: string
  content: string
}

export interface ChannelsMsgPayload {
  objectId: string
  feedType: string
  nickname: string
  avatar: string
  desc: string
  mediaCount: string
  objectNonceId: string
  liveId: string
  username: string
  authIconUrl: string
  authIconType: string
  mediaList?: {
    media?: {
      thumbUrl: string
      fullCoverUrl: string
      videoPlayDuration: string
      url: string
      height: string
      mediaType: string
      width: string
    }
  }
  megaVideo?: object
  bizAuthIconType?: string
}

export interface MiniAppMsgPayload {
  username: string
  appid: string
  pagepath: string
  weappiconurl: string
  shareId: string
}

export interface AppMessagePayload {
  des?: string
  thumburl?: string
  title: string
  url: string
  appattach?: AppAttachPayload
  channel?: ChannelsMsgPayload
  miniApp?: MiniAppMsgPayload
  type: WechatAppMessageType
  md5?: string
  fromusername?: string
  recorditem?: string
  refermsg?: ReferMsgPayload
}

function expandSingleItemArrays(obj: any): any {
  // 检查传入的对象是否是一个数组
  if (Array.isArray(obj)) {
    // 如果数组只有一个元素，则返回这个元素的展开形式
    if (obj.length === 1) {
      return expandSingleItemArrays(obj[0])
    }
    else {
      // 如果数组有多个元素，则递归处理每个元素
      return obj.map(item => expandSingleItemArrays(item))
    }
  }
  else if (typeof obj === 'object' && obj !== null) {
    // 如果是对象，则递归处理它的每个属性
    const result = {}
    for (const key in obj) {
      // @ts-expect-error ignore
      result[key] = expandSingleItemArrays(obj[key])
    }
    return result
  }
  else {
    // 其他类型直接返回
    return obj
  }
}

export async function parseAppmsgMessagePayload(messageContent: string): Promise<AppMessagePayload> {
  const appMsgXml: AppMsgXmlSchema = expandSingleItemArrays(await xmlToJson(messageContent))
  const { title, des, url, thumburl, type, md5, recorditem } = appMsgXml.msg.appmsg

  let appattach: AppAttachPayload | undefined
  let channel: ChannelsMsgPayload | undefined
  let miniApp: MiniAppMsgPayload | undefined
  const tmp = appMsgXml.msg.appmsg.appattach
  const channeltmp = appMsgXml.msg.appmsg.finderFeed
  const minitmp = appMsgXml.msg.appmsg.weappinfo
  if (tmp) {
    appattach = {
      aeskey: tmp.aeskey,
      attachid: tmp.attachid,
      cdnattachurl: tmp.cdnattachurl,
      cdnthumbaeskey: tmp.cdnthumbaeskey,
      emoticonmd5: tmp.emoticonmd5,
      encryver: (tmp.encryver && Number.parseInt(tmp.encryver, 10)) || 0,
      fileext: tmp.fileext,
      islargefilemsg: (tmp.islargefilemsg && Number.parseInt(tmp.islargefilemsg, 10)) || 0,
      totallen: (tmp.totallen && Number.parseInt(tmp.totallen, 10)) || 0,
    }
  }
  if (channeltmp) {
    channel = {
      authIconType: channeltmp.authIconType,
      authIconUrl: channeltmp.authIconUrl,
      avatar: channeltmp.avatar,
      desc: channeltmp.desc,
      feedType: channeltmp.feedType,
      liveId: channeltmp.liveId,
      mediaCount: channeltmp.mediaCount,
      nickname: channeltmp.nickname,
      objectId: channeltmp.objectId,
      objectNonceId: channeltmp.objectNonceId,
      username: channeltmp.username,
    }
  }
  if (minitmp) {
    miniApp = {
      appid: minitmp.appid,
      pagepath: minitmp.pagepath,
      shareId: minitmp.shareId,
      username: minitmp.username,
      weappiconurl: minitmp.weappiconurl,
    }
  }

  return {
    appattach,
    channel,
    des,
    md5,
    miniApp,
    recorditem,
    refermsg: appMsgXml.msg.appmsg.refermsg,
    thumburl,
    title,
    type: Number.parseInt(type, 10),
    url,
  }
}
