import type * as PUPPET from 'wechaty-puppet'
import { WechatAppMessageType } from '@wechatferry/core'
import type { WechatferryAgentEventMessage } from '@wechatferry/agent'
import type { AppMessagePayload } from '../messages'
import { parseAppmsgMessagePayload } from '../messages'
import type { WechatferryPuppet } from '../puppet'
import type { EventPayload } from './events'

const ROOM_OTHER_INVITE_TITLE_ZH = [/邀请你加入群聊/]
const ROOM_OTHER_INVITE_TITLE_EN = [/Group Chat Invitation/]
const ROOM_OTHER_INVITE_LIST_ZH = [/^"(.+)"邀请你加入群聊(.*)，进入可查看详情。/]
const ROOM_OTHER_INVITE_LIST_EN = [/"(.+)" invited you to join the group chat "(.+)"\. Enter to view details\./]

export async function roomInviteParser(puppet: WechatferryPuppet, message: WechatferryAgentEventMessage): Promise<EventPayload> {
  let appMsgPayload: AppMessagePayload
  try {
    appMsgPayload = await parseAppmsgMessagePayload(message.content)
  }
  catch {
    return null
  }

  if (appMsgPayload.type !== WechatAppMessageType.Url) {
    return null
  }

  if (!appMsgPayload.title || !appMsgPayload.des) {
    return null
  }

  let matchesForOtherInviteTitleEn = null as null | string[]
  let matchesForOtherInviteTitleZh = null as null | string[]
  let matchesForOtherInviteEn = null as null | string[]
  let matchesForOtherInviteZh = null as null | string[]

  ROOM_OTHER_INVITE_TITLE_EN.some(regex => !!(matchesForOtherInviteTitleEn = appMsgPayload.title.match(regex)))
  ROOM_OTHER_INVITE_TITLE_ZH.some(regex => !!(matchesForOtherInviteTitleZh = appMsgPayload.title.match(regex)))
  ROOM_OTHER_INVITE_LIST_EN.some(regex => !!(matchesForOtherInviteEn = appMsgPayload.des!.match(regex)))
  ROOM_OTHER_INVITE_LIST_ZH.some(regex => !!(matchesForOtherInviteZh = appMsgPayload.des!.match(regex)))

  const titleMatch = matchesForOtherInviteTitleEn || matchesForOtherInviteTitleZh
  const matchInviteEvent = matchesForOtherInviteEn || matchesForOtherInviteZh
  const matches = !!titleMatch && !!matchInviteEvent

  if (!matches) {
    return null
  }

  return {
    avatar: appMsgPayload.thumburl,
    id: message.id,
    invitation: appMsgPayload.url,
    inviterId: message.sender,
    memberCount: 0,
    memberIdList: [],
    receiverId: message.roomid || puppet.currentUserId,
    timestamp: message.ts,
    topic: matchInviteEvent![2],
  } as PUPPET.payloads.RoomInvitation
}
