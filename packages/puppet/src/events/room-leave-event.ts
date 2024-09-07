import type { WechatferryAgentEventMessage } from '@wechatferry/agent'
import type * as PUPPET from 'wechaty-puppet'
import { executeRunners, isRoomId, isRoomOps } from '../utils'
import { parseTextWithRegexList } from '../utils/regex'
import type { WechatferryPuppet } from '../puppet'
import type { EventPayload } from './events'

const YOU_REMOVE_OTHER_REGEX_LIST = [
  /^(你)将"(.+)"移出了群聊/,
  /^(You) removed "(.+)" from the group chat/,
]
const OTHER_REMOVE_YOU_REGEX_LIST = [
  /^(你)被"([^"]+)"移出群聊/,
  /^(You) were removed from the group chat by "([^"]+)"/,
]

export async function roomLeaveParser(puppet: WechatferryPuppet, message: WechatferryAgentEventMessage): Promise<EventPayload> {
  const roomId = message.roomid
  if (!isRoomId(roomId)) {
    return null
  }

  if (!isRoomOps(message.type)) {
    return null
  }
  const timestamp = message.ts
  const content = message.content.trim()

  /**
   * 1. 我将别人移除
   * /^(你)将"(.+)"移出了群聊/,
   */
  const youRemoveOther = async () => parseTextWithRegexList(content, YOU_REMOVE_OTHER_REGEX_LIST, async (_, match) => {
    const removeeNameList = match[2]?.split('、') ?? []
    const removeeIdList = (await Promise.all(removeeNameList.map(name => puppet.roomMemberSearch(roomId, name)))).flat()
    return {
      removeeIdList,
      removerId: puppet.currentUserId,
      roomId,
      timestamp,
    } as PUPPET.payloads.EventRoomLeave
  })

  /**
   * 2. 别人移除我
   * /^(你)被"([^"]+?)"移出群聊/,
   */
  const otherRemoveYou = async () => parseTextWithRegexList(content, OTHER_REMOVE_YOU_REGEX_LIST, async (_, match) => {
    const removerName = match[2]
    const [removerId] = await puppet.roomMemberSearch(roomId, removerName)
    return {
      removeeIdList: [puppet.currentUserId],
      removerId,
      roomId,
      timestamp,
    } as PUPPET.payloads.EventRoomLeave
  })

  const ret = await executeRunners([youRemoveOther, otherRemoveYou])

  return ret
}
