import type { WechatferryAgentEventMessage } from '@wechatferry/agent'
import type * as PUPPET from 'wechaty-puppet'
import { executeRunners, isRoomId, isRoomOps } from '../utils'
import { parseTextWithRegexList } from '../utils/regex'
import type { EventPayload } from './events'

const OTHER_CHANGE_TOPIC_REGEX_LIST = [
  /^"(.+)"修改群名为“(.+)”$/,
  /^"(.+)" changed the group name to "(.+)"$/,
]
const YOU_CHANGE_TOPIC_REGEX_LIST = [
  /^(你)修改群名为“(.+)”$/,
  /^(You) changed the group name to "(.+)"$/,
]

interface TopicChange { changerId: string, newTopic: string }

export async function roomTopicParser(puppet: PUPPET.Puppet, message: WechatferryAgentEventMessage): Promise<EventPayload> {
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
   * 1. 你修改群名为“(.+)”
   */
  const youChangeTopic = async () => parseTextWithRegexList(content, YOU_CHANGE_TOPIC_REGEX_LIST, async (_, match) => {
    const newTopic = match[2]
    return {
      changerId: puppet.currentUserId,
      newTopic,
    } as TopicChange
  })

  /**
   * 2. “(.+)”修改群名为“(.+)”
   */
  const otherChangeTopic = async () => parseTextWithRegexList(content, OTHER_CHANGE_TOPIC_REGEX_LIST, async (_, match) => {
    const changerName = match[1]
    const newTopic = match[2]
    const [changerId] = await puppet.roomMemberSearch(roomId, changerName)
    return {
      changerId,
      newTopic,
    } as TopicChange
  })

  const topicChange = await executeRunners<TopicChange>([youChangeTopic, otherChangeTopic])
  if (topicChange) {
    const room = await puppet.roomPayload(roomId)
    const oldTopic = room.topic

    return {
      changerId: topicChange.changerId,
      newTopic: topicChange.newTopic,
      oldTopic,
      roomId,
      timestamp,
    } as PUPPET.payloads.EventRoomTopic
  }

  return null
}
