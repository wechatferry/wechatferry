import type { WechatferryAgentChatRoom, WechatferryAgentChatRoomMember, WechatferryAgentContact, WechatferryAgentEventMessage } from "@wechatferry/agent"
import type * as PUPPET from 'wechaty-puppet'

type MaybePromise<T> = T | Promise<T>;
type Nullable<T> = T | null | undefined;

export interface CacheManager {

    // #region  Message
    getMessage(messageId: string): MaybePromise<Nullable<WechatferryAgentEventMessage>>

    setMessage(messageId: string, payload: WechatferryAgentEventMessage): MaybePromise<void>

    hasMessage(messageId: string): MaybePromise<boolean>

    // #region Friendship

    getFriendship(friendshipId: string): MaybePromise<Nullable<PUPPET.payloads.Friendship>>

    setFriendship(friendshipId: string, payload: PUPPET.payloads.Friendship): MaybePromise<void>

    // #region Contact

    getContact(contactId: string): MaybePromise<Nullable<WechatferryAgentContact>>

    setContact(contactId: string, payload: WechatferryAgentContact): MaybePromise<void>

    deleteContact(contactId: string): MaybePromise<void>

    getContactIds(): MaybePromise<string[]>

    getAllContacts(): MaybePromise<WechatferryAgentContact[]>

    hasContact(contactId: string): MaybePromise<boolean>

    getContactCount(): MaybePromise<number>

    setContactList(payload: WechatferryAgentContact[]): MaybePromise<void>

    // #region Room

    getRoom(roomId: string): MaybePromise<Nullable<WechatferryAgentChatRoom>>

    setRoom(roomId: string, payload: WechatferryAgentChatRoom): MaybePromise<void>

    deleteRoom(roomId: string): MaybePromise<void>

    getRoomIds(): MaybePromise<string[]>

    getRoomCount(): MaybePromise<number>

    hasRoom(roomId: string): MaybePromise<boolean>

    setRoomList(payload: WechatferryAgentChatRoom[]): MaybePromise<void>

    // #region Room Invitation

    getRoomInvitation(messageId: string): MaybePromise<Nullable<PUPPET.payloads.RoomInvitation>>

    setRoomInvitation(messageId: string, payload: PUPPET.payloads.RoomInvitation): MaybePromise<void>

    deleteRoomInvitation(messageId: string): MaybePromise<void>

    // #endregion

    // #region Room Member

    getRoomMember(roomId: string, contactId: string): MaybePromise<Nullable<WechatferryAgentChatRoomMember>>

    setRoomMember(roomId: string, contactId: string, payload: WechatferryAgentChatRoomMember): MaybePromise<void>

    deleteRoomMember(roomId: string, contactId: string): MaybePromise<void>

    setRoomMemberList(roomId: string, payload: WechatferryAgentChatRoomMember[]): MaybePromise<void>

    getRoomMemberList(roomId: string): MaybePromise<WechatferryAgentChatRoomMember[]>

    getRoomMemberIds(roomId: string): MaybePromise<string[]>
}
