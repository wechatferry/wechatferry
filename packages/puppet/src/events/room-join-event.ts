import { setTimeout } from 'node:timers/promises'
import type { WechatferryAgentEventMessage } from '@wechatferry/agent'
import type * as PUPPET from 'wechaty-puppet'
import { executeRunners, isRoomId, isRoomOps } from '../utils'
import { parseTextWithRegexList } from '../utils/regex'
import type { WechatferryPuppet } from '../puppet'
import type { EventPayload } from './events'

const YOU_INVITE_OTHER_REGEX_LIST = [
  /^你邀请"(.+)"加入了群聊/,
  /^You invited (.+) to the group chat/,
]
const OTHER_INVITE_YOU_REGEX_LIST = [
  /^"([^"]+)"邀请你加入了群聊，群聊参与人还有：(.+)/,
  /^(.+) invited you to a group chat with (.+)/,
]
const OTHER_INVITE_YOU_AND_OTHER_REGEX_LIST = [
  /^"([^"]+)"邀请你和"(.+?)"加入了群聊/,
  /^(.+?) invited you and (.+?) to (the|a) group chat/,
]
const OTHER_INVITE_OTHER_REGEX_LIST = [
  /^"(.+)"邀请"(.+)"加入了群聊/,
  /^(.+?) invited (.+?) to (the|a) group chat/,
]
const OTHER_JOIN_VIA_YOUR_QRCODE_REGEX_LIST = [
  /^" ?(.+)"通过扫描你分享的二维码加入群聊/,
  /^" ?(.+)" joined group chat via the QR code you shared/,
]
const OTHER_JOIN_VIA_OTHER_QRCODE_REGEX_LIST = [
  /^" ?(.+)"通过扫描"(.+)"分享的二维码加入群聊/,
  /^"(.+)" joined the group chat via the QR Code shared by "(.+)"/,
]

export async function roomJoinParser(puppet: WechatferryPuppet, message: WechatferryAgentEventMessage, retries = 5): Promise<EventPayload> {
  const roomId = message.roomid
  if (!isRoomId(roomId)) {
    return null
  }

  if (!isRoomOps(message.type)) {
    return null
  }

  // 通过昵称匹配，所以先更新群成员列表
  await puppet.updateRoomMemberListCache(roomId)
  const timestamp = message.ts
  const content = message.content.trim()

  /**
   * 1. You Invite Other to join the Room
   * (including other join var qr code you shared)
   * /^你邀请"(.+)"加入了群聊/,
   * /^" ?(.+)"通过扫描你分享的二维码加入群聊/,
   */
  const youInviteOther = () => parseTextWithRegexList(content, [...YOU_INVITE_OTHER_REGEX_LIST, ...OTHER_JOIN_VIA_YOUR_QRCODE_REGEX_LIST], async (_, match) => {
    const inviteeNameList = match[1]?.split('、') ?? []
    const inviteeIdList = (await Promise.all(inviteeNameList.map(name => puppet.roomMemberSearch(roomId, name)))).flat()
    return {
      inviteeIdList,
      inviterId: puppet.currentUserId,
      roomId,
      timestamp,
    } as PUPPET.payloads.EventRoomJoin
  })

  /**
   * 2. Other Invite you to join the Room
   * /^"([^"]+?)"邀请你加入了群聊/,
   */
  const otherInviteYou = async () => parseTextWithRegexList(content, OTHER_INVITE_YOU_REGEX_LIST, async (_, match) => {
    const inviterName = match[1]
    const [inviterId] = await puppet.roomMemberSearch(roomId, inviterName)
    return {
      inviteeIdList: [puppet.currentUserId],
      inviterId,
      roomId,
      timestamp,
    } as PUPPET.payloads.EventRoomJoin
  })

  /**
   * 3. Other invite you and others to join the room
   * /^"([^"]+?)"邀请你和"(.+?)"加入了群聊/,
   * /^"(.+)"邀请"(.+)"加入了群聊/,
   */
  const otherInviteOther = async () => parseTextWithRegexList(content, [...OTHER_INVITE_YOU_AND_OTHER_REGEX_LIST, ...OTHER_INVITE_OTHER_REGEX_LIST], async (index, match) => {
    const inviterName = match[1]
    const inviteeNameList = match[2]?.split('、') ?? []
    const [inviterId] = await puppet.roomMemberSearch(roomId, inviterName)
    const inviteeIdList = (await Promise.all(inviteeNameList.map(name => puppet.roomMemberSearch(roomId, name)))).flat()
    const includingYou = index < OTHER_INVITE_YOU_AND_OTHER_REGEX_LIST.length
    if (includingYou) {
      inviteeIdList.unshift(puppet.currentUserId)
    }
    return {
      inviteeIdList,
      inviterId,
      roomId,
      timestamp,
    } as PUPPET.payloads.EventRoomJoin
  })

  /**
   * 4. Other Invite Other via Qrcode to join a Room
   * /^" (.+)"通过扫描"(.+)"分享的二维码加入群聊/,
   */
  const otherJoinViaQrCode = () => parseTextWithRegexList(content, OTHER_JOIN_VIA_OTHER_QRCODE_REGEX_LIST, async (_, match) => {
    const inviteeName = match[1]
    const inviterName = match[2]
    const [inviterId] = await puppet.roomMemberSearch(roomId, inviterName)
    const [inviteeId] = await puppet.roomMemberSearch(roomId, inviteeName)
    return {
      inviteeIdList: [inviteeId],
      inviterId,
      roomId,
      timestamp,
    } as PUPPET.payloads.EventRoomJoin
  })

  const ret = await executeRunners([youInviteOther, otherInviteYou, otherInviteOther, otherJoinViaQrCode])

  if (!ret) {
    return null
  }

  if (ret.inviteeIdList.length === 0 && retries > 0) {
    await setTimeout(2000)
    return roomJoinParser(puppet, message, retries - 1)
  }
  return ret
}
