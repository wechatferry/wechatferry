import { roomTopicParser } from './room-topic-event'
import { EventType, addEventParser, parseEvent } from './events'
import { messageParser } from './message-event'
import { roomInviteParser } from './room-invite-event'
import { roomJoinParser } from './room-join-event'
import { roomLeaveParser } from './room-leave-event'
import { friendShipParser } from './friendship-event'

addEventParser(EventType.Friendship, friendShipParser)
addEventParser(EventType.RoomInvite, roomInviteParser)
addEventParser(EventType.RoomJoin, roomJoinParser)
addEventParser(EventType.RoomLeave, roomLeaveParser)
addEventParser(EventType.RoomTopic, roomTopicParser)
addEventParser(EventType.Message, messageParser)

export { parseEvent, EventType }
