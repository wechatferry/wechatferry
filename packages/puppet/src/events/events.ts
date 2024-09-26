import type { WechatferryAgentEventMessage } from '@wechatferry/agent'
import { log } from 'wechaty-puppet'
import type * as PUPPET from 'wechaty-puppet'
import type { WechatferryPuppet } from '../puppet'

export * from './room-topic-event'
export * from './message-event'
export * from './room-invite-event'
export * from './room-join-event'
export * from './room-leave-event'
export * from './friendship-event'
export * from './post-event'

export enum EventType {
  Message,
  Post,
  Friendship,
  RoomInvite,
  RoomJoin,
  RoomLeave,
  RoomTopic,
}

export interface EventPayloadSpec {
  [EventType.Message]: WechatferryAgentEventMessage
  [EventType.Post]: PUPPET.payloads.EventPost
  [EventType.Friendship]: PUPPET.payloads.Friendship
  [EventType.RoomInvite]: PUPPET.payloads.RoomInvitation
  [EventType.RoomJoin]: PUPPET.payloads.EventRoomJoin
  [EventType.RoomLeave]: PUPPET.payloads.EventRoomLeave
  [EventType.RoomTopic]: PUPPET.payloads.EventRoomTopic
}

export interface Event<T extends keyof EventPayloadSpec> {
  type: T
  payload: EventPayloadSpec[T]
}

export type EventPayload = EventPayloadSpec[keyof EventPayloadSpec] | null
export type EventParserHandler = (puppet: WechatferryPuppet, message: WechatferryAgentEventMessage) => Promise<EventPayload>
interface EventParser { type: EventType, handler: EventParserHandler }

const EventParserList: Array<EventParser> = []
export function addEventParser(eventType: EventType, parser: EventParserHandler): void {
  EventParserList.push({
    handler: parser,
    type: eventType,
  })
}

export async function parseEvent(puppet: WechatferryPuppet, message: WechatferryAgentEventMessage): Promise<Event<any>> {
  for (const parser of EventParserList) {
    try {
      const parsedPayload = await parser.handler(puppet, message)
      if (parsedPayload) {
        return {
          payload: parsedPayload,
          type: parser.type,
        }
      }
    }
    catch (e) {
      log.error('[Event]', `parse message error: ${(e as Error).stack}`)
    }
  }

  // return normal as message bvy default
  return {
    payload: message,
    type: EventType.Message,
  }
}
