import { roomTopicParser } from './room-topic-event'
import { EventType, addEventParser } from './events'
import { messageParser } from './message-event'
import { roomInviteParser } from './room-invite-event'
import { roomJoinParser } from './room-join-event'
import { roomLeaveParser } from './room-leave-event'
import { friendShipParser } from './friendship-event'
import { postParser } from './post-event'

addEventParser(EventType.Post, postParser)
addEventParser(EventType.Friendship, friendShipParser)
addEventParser(EventType.RoomInvite, roomInviteParser)
addEventParser(EventType.RoomJoin, roomJoinParser)
addEventParser(EventType.RoomLeave, roomLeaveParser)
addEventParser(EventType.RoomTopic, roomTopicParser)
addEventParser(EventType.Message, messageParser)

export * from './events'
