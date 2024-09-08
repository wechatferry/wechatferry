import * as PUPPET from 'wechaty-puppet'
import type { WechatferryAgentEventMessage } from '@wechatferry/agent'
import { WechatMessageType } from '@wechatferry/core'
import xml2js from 'xml2js'
import { xmlToJson } from '../utils'

interface TimelineObject {
  id: string
  username: string
  createTime: number
  contentDesc: string
  contentDescShowType: number
  contentDescScene: number
  private: number
  sightFolded: number
  showFlag: number
  appInfo: AppInfo
  sourceUserName: string
  sourceNickName: string
  statisticsData: string
  statExtStr: string
  ContentObject: ContentObject
  actionInfo: ActionInfo
  location: Location
  publicUserName: string
  streamvideo: StreamVideo
}

interface AppInfo {
  id: string
  version: string
  appName: string
  installUrl: string
  fromUrl: string
  isForceUpdate: number
  isHidden: number
}

interface ContentObject {
  contentStyle: number
  title: string
  description: string
  mediaList: MediaList
  contentUrl: string
}

interface MediaList {
  media?: Media | Media[]
}

interface Media {
  id: string
  type: number
  title: string
  description: string
  private: number
  userData: string
  subType: number
  videoSize: VideoSize
  url: Url
  thumb: Thumb
  size: Size
}

interface VideoSize {
  $: {
    width: number
    height: number
  }
}

interface Url {
  $: {
    type: number
    md5: string
    videomd5: string
    key: string
    token: string
    enc_idx: string
  }
  _: string
}

interface Thumb {
  $: {
    type: number
    key: string
    token: string
    enc_idx: string
  }
  _: string
}

interface Size {
  $: {
    width: number
    height: number
    totalSize: number
  }
}

interface ActionInfo {
  appMsg: AppMsg
}

interface AppMsg {
  messageAction: string
}

interface Location {
  $: {
    poiClassifyId: string
    poiName: string
    poiAddress: string
    poiClassifyType: number
    city: string
  }
}

interface StreamVideo {
  streamvideourl: string
  streamvideothumburl: string
  streamvideoweburl: string
}

interface TimelineXmlSchema {
  TimelineObject: TimelineObject
}

export async function parseTimelineMessagePayload(messageXml: string) {
  const jsonPayload = await xmlToJson<TimelineXmlSchema>(messageXml)
  const { TimelineObject: timeline } = jsonPayload
  const builder = new xml2js.Builder()

  // Helper function to create a message object
  const createMessage = (content: string, id: string, extra = '', thumb = '', xml = ''): WechatferryAgentEventMessage => ({
    content,
    id,
    is_group: false,
    is_self: false,
    roomid: '',
    sender: timeline.username,
    ts: timeline.createTime,
    type: WechatMessageType.Text, // TODO: support other types
    extra,
    thumb,
    xml,
    sign: '',
  })

  const media = timeline.ContentObject.mediaList?.media
  let messages: WechatferryAgentEventMessage[] = []
  if (media) {
    const mediaList = Array.isArray(media) ? media : [media]
    messages = mediaList.map(media =>
      createMessage(media.description, media.id, media.url?._ || '', media.thumb?._ || '', builder.buildObject(media)),
    )
  }

  if (messages.length === 0) {
    messages.push(createMessage(timeline.contentDesc || '', timeline.id))
  }

  const postPayload: PUPPET.payloads.PostServer = {
    id: timeline.id,
    parentId: timeline.id,
    rootId: timeline.id,
    contactId: timeline.username,
    timestamp: timeline.createTime,
    counter: {
      children: 0,
      descendant: 0,
      taps: {},
    },
    type: PUPPET.types.Post.Moment,
    sayableList: messages.map(m => m.id),
  }

  return {
    messages,
    payload: postPayload,
  }
}
