import type { Storage, StorageValue } from 'unstorage'
import type { WechatferryAgentChatRoom, WechatferryAgentChatRoomMember, WechatferryAgentContact, WechatferryAgentEventMessage } from '@wechatferry/agent'
import type * as PUPPET from 'wechaty-puppet'
import type { PrefixStorage } from './utils'
import { createPrefixStorage } from './utils'

export class CacheManager {
  private storage: Storage<StorageValue>
  private messageCache: PrefixStorage<WechatferryAgentEventMessage>
  private contactCache: PrefixStorage<WechatferryAgentContact>
  private roomCache: PrefixStorage<WechatferryAgentChatRoom>
  private roomInvitationCache: PrefixStorage<PUPPET.payloads.RoomInvitation>
  private friendshipCache: PrefixStorage<PUPPET.payloads.Friendship>
  private roomMemberCacheList: Map<string, PrefixStorage<WechatferryAgentChatRoomMember>> = new Map()

  constructor(storage: Storage<StorageValue>) {
    this.storage = storage
    this.messageCache = createPrefixStorage<WechatferryAgentEventMessage>(storage, 'wcf:message')
    this.contactCache = createPrefixStorage<WechatferryAgentContact>(storage, 'wcf:contact')
    this.roomCache = createPrefixStorage<WechatferryAgentChatRoom>(storage, 'wcf:room')
    this.roomInvitationCache = createPrefixStorage<PUPPET.payloads.RoomInvitation>(storage, 'wcf:room-invitation')
    this.friendshipCache = createPrefixStorage<PUPPET.payloads.Friendship>(storage, 'wcf:friendship')
  }

  private getRoomMemberCache(roomId: string) {
    if (!this.roomMemberCacheList.has(roomId)) {
      this.roomMemberCacheList.set(roomId, createPrefixStorage<WechatferryAgentChatRoomMember>(this.storage, `wcf:room-member:${roomId}`))
    }
    return this.roomMemberCacheList.get(roomId)!
  }

  // #region  Message
  getMessage(messageId: string) {
    return this.messageCache.getItem(messageId)
  }

  setMessage(messageId: string, payload: WechatferryAgentEventMessage) {
    return this.messageCache.setItem(messageId, payload)
  }

  hasMessage(messageId: string) {
    return this.messageCache.hasItem(messageId)
  }

  // #region Friendship

  getFriendship(friendshipId: string) {
    return this.friendshipCache.getItem(friendshipId)
  }

  setFriendship(friendshipId: string, payload: PUPPET.payloads.Friendship) {
    return this.friendshipCache.setItem(friendshipId, payload)
  }

  // #region Contact

  getContact(contactId: string) {
    return this.contactCache.getItem(contactId)
  }

  setContact(contactId: string, payload: WechatferryAgentContact) {
    return this.contactCache.setItem(contactId, payload)
  }

  deleteContact(contactId: string) {
    return this.contactCache.removeItem(contactId)
  }

  getContactIds() {
    return this.contactCache.getKeys()
  }

  getAllContacts() {
    return this.contactCache.getItemsList()
  }

  hasContact(contactId: string) {
    return this.contactCache.hasItem(contactId)
  }

  async getContactCount() {
    const keys = await this.contactCache.getKeys()
    return keys.length
  }

  setContactList(payload: WechatferryAgentContact[]) {
    return Promise.all(payload.map(contact => this.contactCache.setItem(contact.UserName, contact)))
  }

  // #region Room

  getRoom(roomId: string) {
    return this.roomCache.getItem(roomId)
  }

  setRoom(roomId: string, payload: WechatferryAgentChatRoom) {
    return this.roomCache.setItem(roomId, payload)
  }

  deleteRoom(roomId: string) {
    return this.roomCache.removeItem(roomId)
  }

  getRoomIds() {
    return this.roomCache.getKeys()
  }

  async getRoomCount() {
    const keys = await this.roomCache.getKeys()
    return keys.length
  }

  hasRoom(roomId: string) {
    return this.roomCache.hasItem(roomId)
  }

  setRoomList(payload: WechatferryAgentChatRoom[]) {
    return Promise.all(payload.map(room => this.roomCache.setItem(room.UserName, room)))
  }

  // #region Room Invitation

  getRoomInvitation(messageId: string) {
    return this.roomInvitationCache.getItem(messageId)
  }

  setRoomInvitation(messageId: string, payload: PUPPET.payloads.RoomInvitation) {
    return this.roomInvitationCache.setItem(messageId, payload)
  }

  deleteRoomInvitation(messageId: string) {
    return this.roomInvitationCache.removeItem(messageId)
  }

  // #endregion

  // #region Room Member

  getRoomMember(roomId: string, contactId: string) {
    const cache = this.getRoomMemberCache(roomId)
    return cache.getItem(contactId)
  }

  setRoomMember(roomId: string, contactId: string, payload: WechatferryAgentChatRoomMember) {
    const cache = this.getRoomMemberCache(roomId)
    return cache.setItem(contactId, payload)
  }

  deleteRoomMember(roomId: string, contactId: string) {
    const cache = this.getRoomMemberCache(roomId)
    return cache.removeItem(contactId)
  }

  setRoomMemberList(roomId: string, payload: WechatferryAgentChatRoomMember[]) {
    const cache = this.getRoomMemberCache(roomId)
    return Promise.all(payload.map(member => cache.setItem(member.UserName, member)))
  }

  getRoomMemberList(roomId: string) {
    const cache = this.getRoomMemberCache(roomId)
    return cache.getItemsList()
  }

  getRoomMemberIds(roomId: string) {
    const cache = this.getRoomMemberCache(roomId)
    return cache.getKeys()
  }
}
