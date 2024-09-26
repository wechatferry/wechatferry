import { setTimeout as sleep } from 'node:timers/promises'
import type { WechatferryAgentChatRoom, WechatferryAgentChatRoomMember, WechatferryAgentContact, WechatferryAgentEventMessage } from '@wechatferry/agent'
import { WechatferryAgent } from '@wechatferry/agent'
import * as PUPPET from 'wechaty-puppet'
import { createStorage } from 'unstorage'
import { log } from 'wechaty-puppet'
import { FileBox, type FileBoxInterface } from 'file-box'
import localPackageJson from '../package.json'
import type { PuppetContact, PuppetWcferryOptions, PuppetWcferryUserOptions } from './types'
import { getMentionText, isRoomId, mentionTextParser } from './utils'
import { CacheManager } from './cache-manager'
import { parseAppmsgMessagePayload, parseContactCardMessagePayload, parseEmotionMessagePayload, parseMiniProgramMessagePayload, parseTimelineMessagePayload } from './messages'
import { wechatferryContactToWechaty, wechatferryDBMessageToEventMessage, wechatferryMessageToWechaty, wechatferryRoomMemberToWechaty, wechatferryRoomToWechaty, wechatyContactToWechatferry } from './schema-mapper'
import { EventType, parseEvent } from './events'

export function resolvePuppetWcferryOptions(userOptions: PuppetWcferryUserOptions): PuppetWcferryOptions {
  return {
    agent: new WechatferryAgent(),
    storage: createStorage(),
    ...userOptions,
  }
}

export class WechatferryPuppet extends PUPPET.Puppet {
  static override readonly VERSION = localPackageJson.version!
  agent: WechatferryAgent
  private cacheManager: CacheManager
  private heartBeatTimer?: ReturnType<typeof setTimeout>

  constructor(options: PuppetWcferryUserOptions = {}) {
    super()
    const { agent, storage } = resolvePuppetWcferryOptions(options)
    this.agent = agent
    this.cacheManager = new CacheManager(storage)
  }

  override name() { return `${localPackageJson.name}<${super.name()}>` }
  override version() { return `${localPackageJson.version}<${super.version()}>` }

  override async onStart(): Promise<void> {
    log.verbose('WechatferryPuppet', 'onStart()')
    this.agent.on('login', user => this.login(user.wxid))
    this.agent.on('logout', () => this.logout())
    this.agent.on('error', e => this.emit('error', e))
    this.agent.start()
    this.startPuppetHeart()
  }

  override login(userId: string): void
  override async login(userId: string) {
    log.verbose('WechatferryPuppet', 'login(%s)', userId)
    await this.loadContactList()
    await this.loadRoomList()
    const user = await this.updateContactCache(userId)
    if (!user) {
      throw new Error(
        `login(${userId}) called failed: User not found.`,
      )
    }
    super.login(user.userName)
    this.emit('ready')
    this.agent.on('message', this.onMessage.bind(this))
  }

  override async onStop(): Promise<void> {
    log.verbose('WechatferryPuppet', 'onStop()')
    this.stopPuppetHeart()
    this.agent.stop()
    this.agent.removeAllListeners()
  }

  override async ding(data?: string) {
    log.silly('WechatferryPuppet', 'ding(%s)', data || '')
    await sleep(1000)
    this.emit('dong', { data: data || '' })
  }

  async onMessage(message: WechatferryAgentEventMessage) {
    const messageId = message.id
    // fallback system sender
    if (message.roomid && !message.sender) {
      message.sender = 'fmessage'
    }
    await this.cacheManager.setMessage(messageId, message)
    const event = await parseEvent(this, message)
    const roomId = message.roomid
    log.verbose('WechatferryPuppet', 'onMessage() event %s', JSON.stringify(EventType[event.type]))
    log.verbose('WechatferryPuppet', 'onMessage() event %s', JSON.stringify(event.payload, null, 2))
    switch (event.type) {
      case EventType.Message: {
        this.emit('message', { messageId })
        break
      }
      case EventType.Post: {
        this.emit('post', event.payload)
        break
      }
      case EventType.Friendship: {
        const friendship: PUPPET.payloads.Friendship = event.payload
        await this.cacheManager.setFriendship(messageId, friendship)
        this.emit('friendship', {
          friendshipId: messageId,
        })
        break
      }
      case EventType.RoomInvite: {
        await this.cacheManager.setRoomInvitation(messageId, event.payload)
        this.emit('room-invite', {
          roomInvitationId: messageId,
        })
        break
      }
      case EventType.RoomJoin: {
        this.emit('room-join', event.payload)
        // DO NOT UPDATE LISTS HERE
        break
      }

      case EventType.RoomLeave: {
        const payload = event.payload as PUPPET.payloads.EventRoomLeave
        this.emit('room-leave', payload)
        for (const memberId of payload.removeeIdList) {
          await this.cacheManager.deleteRoomMember(roomId, memberId)
        }
        break
      }
      case EventType.RoomTopic: {
        this.emit('room-topic', event.payload)
        this.updateRoomCache(roomId)
        break
      }
    }
  }

  private lastSelfMessageId = ''
  // TODO: need better way
  async onSendMessage(timeout = 5) {
    let localId: number | undefined
    for (let cnt = 0; cnt < timeout; cnt++) {
      log.verbose('WechatferryPuppet', `onSendMessage(${timeout}): ${cnt}`)
      const messagePayload = this.agent.getLastSelfMessage(localId)
      const messageId = `${messagePayload.msgSvrId}`
      if (messageId === '0') {
        localId = messagePayload.localId
      }
      log.verbose('WechatferryPuppet', 'onSendMessage() messagePayload %s', JSON.stringify(messagePayload))
      const hasNewMessage = this.lastSelfMessageId !== messageId
      if (hasNewMessage && messageId !== '0') {
        const message = wechatferryDBMessageToEventMessage(messagePayload)
        log.verbose('WechatferryPuppet', 'onSendMessage() message %s', JSON.stringify(message))
        this.lastSelfMessageId = message.id
        await this.cacheManager.setMessage(message.id, message)
        this.emit('message', {
          messageId: message.id,
        })
        return
      }
      await sleep(1000)
    }
  }

  // #region ContactSelf

  override async contactSelfQRCode(): Promise<string> {
    log.verbose('WechatferryPuppet', 'contactSelfQRCode()')
    throw new Error(
      `contactSelfQRCode() called failed: Method not supported.`,
    )
  }

  override async contactSelfName(name: string): Promise<void> {
    log.verbose('WechatferryPuppet', 'contactSelfName(%s)', name)
    throw new Error(
      `contactSelfName(${name}) called failed: Method not supported.`,
    )
  }

  override async contactSelfSignature(signature: string): Promise<void> {
    log.verbose('WechatferryPuppet', 'contactSelfSignature(%s)', signature)
    throw new Error(
      `contactSelfSignature(${signature}) called failed: Method not supported.`,
    )
  }

  // #endregion

  // #region Contact

  override contactAlias(contactId: string): Promise<string>
  override contactAlias(contactId: string, alias: string | null): Promise<void>
  override async contactAlias(contactId: string, alias?: string | null): Promise<void | string> {
    log.verbose('WechatferryPuppet', 'contactAlias(%s, %s)', contactId, alias)

    if (alias) {
      throw new Error(
        `contactAlias(${contactId}, ${alias}) called failed: Method not supported.`,
      )
    }

    const contact = await this.contactRawPayload(contactId)

    if (!contact) {
      throw new Error(
        `contactAlias(${contactId}) called failed: Contact not found.`,
      )
    }

    return contact.alias
  }

  override async contactPhone(contactId: string): Promise<string[]>
  override async contactPhone(contactId: string, phoneList: string[]): Promise<void>
  override async contactPhone(contactId: string, phoneList?: string[]): Promise<string[] | void> {
    log.verbose('WechatferryPuppet', 'contactPhone(%s, %s)', contactId, phoneList)
    throw new Error(
      `contactPhone(${contactId}, ${phoneList}) called failed: Method not supported.`,
    )
  }

  override async contactCorporationRemark(contactId: string, corporationRemark: string) {
    log.verbose('WechatferryPuppet', 'contactCorporationRemark(%s, %s)', contactId, corporationRemark)
    throw new Error(
      `contactCorporationRemark(${contactId}, ${corporationRemark}) called failed: Method not supported.`,
    )
  }

  override async contactDescription(contactId: string, description: string) {
    log.verbose('WechatferryPuppet', 'contactDescription(%s, %s)', contactId, description)
    throw new Error(
      `contactDescription(${contactId}, ${description}) called failed: Method not supported.`,
    )
  }

  override async contactList(): Promise<string[]> {
    log.verbose('WechatferryPuppet', 'contactList()')
    return this.cacheManager.getContactIds()
  }

  override async contactAvatar(contactId: string): Promise<FileBoxInterface>
  override async contactAvatar(contactId: string, file: FileBoxInterface): Promise<void>
  override async contactAvatar(contactId: string, file?: FileBoxInterface): Promise<void | FileBoxInterface> {
    log.verbose('WechatferryPuppet', 'contactAvatar(%s)', contactId)
    if (file) {
      throw new Error(
        `contactAvatar(${contactId}, ${file}) called failed: Method not supported.`,
      )
    }
    const contact = await this.getContactPayload(contactId)
    return FileBox.fromUrl(contact.avatar)
  }

  override async contactRawPayloadParser(payload: WechatferryAgentContact) {
    return wechatferryContactToWechaty(payload)
  }

  override async contactRawPayload(id: string): Promise<WechatferryAgentContact | null> {
    log.verbose('WechatferryPuppet', 'contactRawPayload(%s)', id)

    const contact = await this.cacheManager.getContact(id)
    if (!contact) {
      return this.updateContactCache(id)
    }
    return contact
  }

  // #endregion

  // #region Conversation

  override conversationReadMark(conversationId: string, hasRead?: boolean | undefined): Promise<boolean | void>
  override conversationReadMark(conversationId: string, hasRead?: boolean | undefined): Promise<boolean | void> {
    log.verbose('WechatferryPuppet', 'conversationRead(%s, %s)', conversationId, hasRead)
    throw new Error(
      `conversationReadMark(${conversationId}, ${hasRead}) called failed: Method not supported.`,
    )
  }
  // #endregion

  // #region Message

  override messageContact(messageId: string): Promise<string>
  override async messageContact(messageId: string): Promise<string> {
    const message = await this.getMessagePayload(messageId)
    if (!message.text) {
      throw new Error(
        `messageContact(${messageId}) called failed: message.text is empty.`,
      )
    }
    const contact = await parseContactCardMessagePayload(message.text)
    // push fake contact to cache
    await this.cacheManager.setContact(contact.id, wechatyContactToWechatferry(contact))
    return contact.id
  }

  override async messageImage(
    messageId: string,
    imageType: PUPPET.types.Image,
  ): Promise<FileBoxInterface> {
    log.verbose('WechatferryPuppet', 'messageImage(%s, %s[%s])', messageId, imageType, PUPPET.types.Image[imageType])
    const rawMessage = await this.messageRawPayload(messageId)
    return this.agent.downloadFile(rawMessage)
  }

  override async messageRecall(
    messageId: string,
  ): Promise<boolean> {
    log.verbose('WechatferryPuppet', 'messageRecall(%s)', messageId)
    return this.agent.revokeMsg(messageId) === 1
  }

  override async messageFile(messageId: string): Promise<FileBoxInterface> {
    const rawMessage = await this.messageRawPayload(messageId)
    const message = await this.messageRawPayloadParser(rawMessage)

    switch (message.type) {
      case PUPPET.types.Message.Image:
        return this.messageImage(messageId, PUPPET.types.Image.HD)
      case PUPPET.types.Message.Video:
      case PUPPET.types.Message.Attachment:
      case PUPPET.types.Message.Audio:
        return this.agent.downloadFile(rawMessage)

      case PUPPET.types.Message.Emoticon: {
        const emotionPayload = await parseEmotionMessagePayload(message)
        const emoticonBox = FileBox.fromUrl(emotionPayload.cdnurl, { name: `message-${messageId}-emoticon.jpg` })
        emoticonBox.metadata = {
          payload: emotionPayload,
          type: 'emoticon',
        }
        return emoticonBox
      }
    }

    throw new Error(
      `messageFile(${messageId}) called failed: Cannot get file from message type ${message.type}.`,
    )
  }

  override async messageUrl(messageId: string): Promise<PUPPET.payloads.UrlLink> {
    log.verbose('WechatferryPuppet', 'messageUrl(%s)', messageId)
    const message = await this.getMessagePayload(messageId)
    if (!message.text) {
      throw new Error(
        `messageUrl(${messageId}) called failed: message.text is empty.`,
      )
    }
    const appPayload = await parseAppmsgMessagePayload(message.text)
    return {
      description: appPayload.des,
      thumbnailUrl: appPayload.thumburl,
      title: appPayload.title,
      url: appPayload.url,
    }
  }

  override async messageLocation(messageId: string): Promise<PUPPET.payloads.Location> {
    log.verbose('WechatferryPuppet', 'messageLocation(%s)', messageId)

    // const message = await this.getMessagePayload(messageId)

    throw new Error(
      `messageLocation(${messageId}) called failed: Method not supported.`,
    )
  }

  override async messageMiniProgram(messageId: string): Promise<PUPPET.payloads.MiniProgram> {
    log.verbose('WechatferryPuppet', 'messageMiniProgram(%s)', messageId)

    const message = await this.getMessagePayload(messageId)

    return parseMiniProgramMessagePayload(message)
  }

  override async messageRawPayloadParser(payload: WechatferryAgentEventMessage) {
    log.verbose('WechatferryPuppet', 'messageRawPayloadParser(%s)', payload)
    return wechatferryMessageToWechaty(this, payload)
  }

  override async messageRawPayload(id: string): Promise<WechatferryAgentEventMessage> {
    log.verbose('WechatferryPuppet', 'messageRawPayload(%s)', id)

    const message = await this.cacheManager.getMessage(id)
    if (!message) {
      throw new Error(
        `messageRawPayload(${id}) called failed: Message not found.`,
      )
    }
    return message
  }

  // #endregion

  // #region Send

  override async messageSendText(
    conversationId: string,
    text: string,
  ): Promise<void>
  async messageSendText(
    conversationId: string,
    text: string,
    mentionIdList?: string[],
  ): Promise<string | void> {
    const sendText = (text: string, mentions?: string[]) => {
      this.agent.sendText(conversationId, text, mentions)
      this.onSendMessage()
    }

    log.verbose('messageSendText', 'preparing to send message')

    if (!isRoomId(conversationId)) {
      log.verbose('messageSendText', 'normal text')
      sendText(text)
      return
    }

    if (mentionIdList?.length) {
      log.verbose('messageSendText', 'mention text')
      sendText(text, mentionIdList)
      return
    }

    if (text.includes('@all')) {
      log.verbose('messageSendText', 'at all')
      text = text.replace('@all', '@所有人').trim()
      sendText(text, ['notify@all'])
      return
    }

    const mentionRegex = /@\[mention:[^\]]+\]/
    if (mentionRegex.test(text)) {
      log.verbose('messageSendText', 'at mention')
      const { mentions, message } = mentionTextParser(text)
      const members = await this.cacheManager.getRoomMemberList(conversationId)
      const mentionText = getMentionText(mentions, members)
      sendText(`${mentionText} ${message}`, mentions)
      return
    }

    log.verbose('messageSendText', 'normal text')
    sendText(text)
  }

  override async messageSendFile(conversationId: string, file: FileBoxInterface): Promise<void> {
    log.verbose('PuppetBridge', 'messageSendFile(%s, %s)', conversationId, file)
    if (file.mediaType.startsWith('image')) {
      await this.agent.sendImage(conversationId, file)
    }
    else {
      await this.agent.sendFile(conversationId, file)
    }
    this.onSendMessage()
  }

  override async messageSendContact(
    conversationId: string,
    contactId: string,
  ): Promise<void> {
    log.verbose('WechatferryPuppet', 'messageSendUrl(%s, %s)', conversationId, contactId)

    throw new Error(
      `messageSendContact(${conversationId}, ${contactId}) called failed: Method not supported.`,
    )
  }

  override async messageSendUrl(
    conversationId: string,
    urlLinkPayload: PUPPET.payloads.UrlLink,
  ): Promise<void> {
    log.verbose('WechatferryPuppet', 'messageSendUrl(%s, %s)', conversationId, JSON.stringify(urlLinkPayload))

    this.agent.sendRichText(conversationId, {
      title: urlLinkPayload.title,
      digest: urlLinkPayload.description,
      thumburl: urlLinkPayload.thumbnailUrl,
      url: urlLinkPayload.url,
      name: urlLinkPayload.name,
      account: urlLinkPayload.account,
    })
    this.onSendMessage()
  }

  override async messageSendLocation(
    conversationId: string,
    locationPayload: PUPPET.payloads.Location,
  ): Promise<void> {
    log.verbose('WechatferryPuppet', 'messageSendLocation(%s, %s)', conversationId, JSON.stringify(locationPayload))

    throw new Error(
      `messageSendLocation(${conversationId}, ${locationPayload}) called failed: Method not supported.`,
    )
  }

  override async messageSendMiniProgram(
    conversationId: string,
    miniProgramPayload: PUPPET.payloads.MiniProgram,
  ): Promise<void> {
    log.verbose('WechatferryPuppet', 'messageSendMiniProgram(%s, %s)', conversationId, JSON.stringify(miniProgramPayload))

    throw new Error(
      `messageSendMiniProgram(${conversationId}, ${miniProgramPayload}) called failed: Method not supported.`,
    )
  }

  override async messageForward(
    conversationId: string,
    messageId: string,
  ): Promise<void | string> {
    log.verbose('WechatferryPuppet', 'messageForward(%s, %s)', conversationId, messageId)
    this.agent.forwardMsg(conversationId, messageId)
    this.onSendMessage()
  }

  // #endregion

  // #region Room

  override async roomList(): Promise<string[]> {
    log.verbose('WechatferryPuppet', 'roomList()')
    return this.cacheManager.getRoomIds()
  }

  override roomCreate(contactIdList: string[], topic?: string | undefined): Promise<string> {
    log.verbose('WechatferryPuppet', 'roomCreate(%s, %s)', contactIdList, topic)
    throw new Error(
      `roomCreate(${contactIdList}, ${topic}) called failed: Method not supported.`,
    )
  }

  override async roomQuit(roomId: string): Promise<void> {
    log.verbose('WechatferryPuppet', 'roomQuit(%s)', roomId)
    throw new Error(
      `roomQuit(${roomId}) called failed: Method not supported.`,
    )
  }

  override async roomAdd(roomId: string, contactId: string): Promise<void> {
    log.verbose('WechatferryPuppet', 'roomAdd(%s, %s)', roomId, contactId)

    if (!roomId || !contactId) {
      log.error('roomAdd: roomId or contactId not found')
      return
    }

    const memberList = await this.roomMemberList(roomId)

    if (memberList.includes(contactId)) {
      return
    }

    if (memberList.length > 40) {
      this.agent.inviteChatRoomMembers(roomId, contactId)
      return
    }
    this.agent.addChatRoomMembers(roomId, contactId)
  }

  override async roomDel(
    roomId: string,
    contactId: string,
  ): Promise<void> {
    log.verbose('WechatferryPuppet', 'roomDel(%s, %s)', roomId, contactId)
    this.agent.removeChatRoomMembers(roomId, contactId)
  }

  override async roomAvatar(roomId: string): Promise<FileBoxInterface> {
    log.verbose('WechatferryPuppet', 'roomAvatar(%s)', roomId)
    const payload = await this.getRoomPayload(roomId)
    if (!payload.avatar) {
      throw new Error(
        `roomAvatar(${roomId}) called failed: Room avatar not set.`,
      )
    }

    return FileBox.fromUrl(payload.avatar)
  }

  override async roomTopic(roomId: string): Promise<string>
  override async roomTopic(roomId: string, topic: string): Promise<void>
  override async roomTopic(roomId: string, topic?: string): Promise<string | void> {
    if (topic) {
      throw new Error(
        `roomTopic(${roomId}, ${topic}) called failed: Method not supported.`,
      )
    }

    const room = await this.getRoomPayload(roomId)
    return room.topic
  }

  override async roomQRCode(roomId: string): Promise<string> {
    log.verbose('WechatferryPuppet', 'roomQRCode(%s)', roomId)
    throw new Error(
      `roomQRCode(${roomId}) called failed: Method not supported.`,
    )
  }

  override async roomAnnounce(roomId: string): Promise<string>
  override async roomAnnounce(roomId: string, text: string): Promise<void>
  override async roomAnnounce(roomId: string, text?: string): Promise<void | string> {
    if (text) {
      throw new Error(
        `roomAnnounce(${roomId}, ${text}) called failed: Method not supported.`,
      )
    }

    const room = await this.getRoomPayload(roomId)
    return room.announce
  }

  // #endregion

  // #region Room Invitation
  override async roomInvitationAccept(roomInvitationId: string): Promise<void> {
    log.verbose('WechatferryPuppet', 'roomInvitationAccept(%s)', roomInvitationId)
    throw new Error(
      `roomInvitationAccept(${roomInvitationId}) called failed: Method not supported.`,
    )
  }

  override async roomInvitationRawPayload(roomInvitationId: string): Promise<PUPPET.payloads.RoomInvitation> {
    log.verbose('WechatferryPuppet', 'roomInvitationRawPayload(%s)', roomInvitationId)
    const roomInvitation = await this.cacheManager.getRoomInvitation(roomInvitationId)
    if (!roomInvitation) {
      throw new Error(
        `roomInvitationRawPayload(${roomInvitationId}) called failed: Room invitation not found.`,
      )
    }
    return roomInvitation
  }

  override async roomInvitationRawPayloadParser(rawPayload: any): Promise<PUPPET.payloads.RoomInvitation> {
    log.verbose('WechatferryPuppet', 'roomInvitationRawPayloadParser(%s)', JSON.stringify(rawPayload))
    return rawPayload
  }

  override async roomMemberList(roomId: string): Promise<string[]> {
    log.verbose('WechatferryPuppet', 'roomMemberList(%s)', roomId)
    const members = await this.cacheManager.getRoomMemberIds(roomId)
    return members
  }

  override async roomMemberRawPayloadParser(rawPayload: WechatferryAgentChatRoomMember): Promise<PUPPET.payloads.RoomMember> {
    log.verbose('WechatferryPuppet', 'roomMemberRawPayloadParser(%s)', rawPayload)
    return wechatferryRoomMemberToWechaty(rawPayload)
  }

  override async roomMemberRawPayload(roomId: string, contactId: string): Promise<WechatferryAgentChatRoomMember | null> {
    log.verbose('WechatferryPuppet', 'roomMemberRawPayload(%s, %s)', roomId, contactId)

    const member = await this.cacheManager.getRoomMember(roomId, contactId)

    if (!member) {
      return await this.updateRoomMemberCache(roomId, contactId)
    }

    return member
  }

  override async roomRawPayloadParser(payload: WechatferryAgentChatRoom) {
    return wechatferryRoomToWechaty(payload)
  }

  override async roomRawPayload(id: string): Promise<WechatferryAgentChatRoom | null> {
    log.verbose('WechatferryPuppet', 'roomRawPayload(%s)', id)

    const room = await this.cacheManager.getRoom(id)
    if (!room) {
      return await this.updateRoomCache(id)
    }
    return room
  }

  // #endregion

  // #region Friendship

  override async friendshipSearchPhone(
    phone: string,
  ): Promise<null | string> {
    log.verbose('WechatferryPuppet', 'friendshipSearchPhone(%s)', phone)
    throw new Error(`friendshipSearchPhone(${phone}) called failed: Method not supported.`)
  }

  override async friendshipSearchWeixin(
    weixin: string,
  ): Promise<null | string> {
    log.verbose('WechatferryPuppet', 'friendshipSearchWeixin(%s)', weixin)
    throw new Error(`friendshipSearchWeixin(${weixin}) called failed: Method not supported.`)
  }

  override async friendshipAdd(
    contactId: string,
    hello: string,
  ): Promise<void> {
    log.verbose('WechatferryPuppet', 'friendshipAdd(%s, %s)', contactId, hello)
    throw new Error(`friendshipAdd(${contactId}, ${hello}) called failed: Method not supported.`)
  }

  override async friendshipAccept(
    friendshipId: string,
  ): Promise<void> {
    log.verbose('WechatferryPuppet', 'friendshipAccept(%s)', friendshipId)
    throw new Error(`friendshipAccept(${friendshipId}) called failed: Method not supported.`)
  }

  override async friendshipRawPayloadParser(rawPayload: any): Promise<PUPPET.payloads.Friendship> {
    return rawPayload
  }

  override async friendshipRawPayload(id: string): Promise<any> {
    const friendship = await this.cacheManager.getFriendship(id)

    if (!friendship) {
      throw new Error(
        `friendshipRawPayload(${id}) called failed: Friendship not found.`,
      )
    }
    return friendship
  }

  // #endregion

  // #region Tag

  override async tagContactAdd(
    tagId: string,
    contactId: string,
  ): Promise<void> {
    log.verbose('WechatferryPuppet', 'tagContactAdd(%s)', tagId, contactId)
    throw new Error(`tagContactAdd(${tagId}, ${contactId}) called failed: Method not supported.`)
  }

  override async tagContactRemove(
    tagId: string,
    contactId: string,
  ): Promise<void> {
    log.verbose('WechatferryPuppet', 'tagContactRemove(%s)', tagId, contactId)
    throw new Error(`tagContactRemove(${tagId}, ${contactId}) called failed: Method not supported.`)
  }

  override async tagContactDelete(
    tagId: string,
  ): Promise<void> {
    log.verbose('WechatferryPuppet', 'tagContactDelete(%s)', tagId)
    throw new Error(`tagContactDelete(${tagId}) called failed: Method not supported.`)
  }

  override async tagContactList(
    contactId?: string,
  ): Promise<string[]> {
    log.verbose('WechatferryPuppet', 'tagContactList(%s)', contactId)
    if (contactId) {
      const contact = await this.cacheManager.getContact(contactId)
      return contact?.tags || []
    }
    return this.agent.getContactTagList().map(v => v.labelId)
  }

  // #endregion

  // #region Post

  override postPublish(payload: PUPPET.payloads.Post): Promise<string | void>
  override postPublish(payload: PUPPET.payloads.Post): Promise<string | void> {
    log.verbose('WechatferryPuppet', 'postPublish({type: %s})', PUPPET.types.Post[
      payload.type || PUPPET.types.Post.Unspecified
    ])
    throw new Error(`postPublish(${payload}) called failed: Method not supported.`)
  }

  override async postSearch(
    filter: PUPPET.filters.Post,
    pagination?: PUPPET.filters.PaginationRequest,
  ): Promise<PUPPET.filters.PaginationResponse<string[]>> {
    log.verbose('WechatferryPuppet', 'postSearch(%s, %s)', JSON.stringify(filter), JSON.stringify(pagination))

    if (filter.type !== PUPPET.types.Post.Moment) {
      return {
        nextPageToken: undefined,
        response: [],
      }
    }

    const response = await this.messageSearch({
      id: filter.id,
      type: PUPPET.types.Message.Post,
      fromId: filter.contactId,
    })

    return {
      nextPageToken: undefined,
      response,
    }
  }

  override async postRawPayloadParser(rawPayload: WechatferryAgentEventMessage): Promise<PUPPET.payloads.Post> {
    log.verbose('WechatferryPuppet', 'postRawPayloadParser(%s)', rawPayload.id)
    const { messages, payload } = await parseTimelineMessagePayload(rawPayload.xml)

    for (const message of messages) {
      const exist = await this.cacheManager.hasMessage(message.id)
      if (!exist) {
        await this.cacheManager.setMessage(message.id, message)
      }
    }

    return payload
  }

  override async postRawPayload(postId: string) {
    log.verbose('WechatferryPuppet', 'postRawPayload(%s)', postId)
    const post = await this.cacheManager.getMessage(postId)
    if (!post) {
      throw new Error(
        `postRawPayload(${postId}) called failed: Message not found.`,
      )
    }
    return post
  }

  // #endregion

  // #region Tap

  override async tap(
    postId: string,
    type?: PUPPET.types.Tap,
    tap?: boolean,
  ): Promise<void | boolean> {
    log.verbose('WechatferryPuppet', 'tap(%s, %s%s)', postId, PUPPET.types.Tap[
      type || PUPPET.types.Tap.Unspecified
    ], typeof tap === 'undefined' ? '' : `, ${tap}`)

    throw new Error(`tap(${postId}, ${type}, ${tap}) called failed: Method not supported.`)
  }

  override async tapSearch(
    postId: string,
    query?: PUPPET.filters.Tap,
    pagination?: PUPPET.filters.PaginationRequest,
  ): Promise<PUPPET.filters.PaginationResponse<PUPPET.payloads.Tap>> {
    log.verbose('WechatferryPuppet', 'tapSearch(%s%s%s)', postId, typeof query === 'undefined' ? '' : `, ${JSON.stringify(query)}`, typeof pagination === 'undefined' ? '' : `, ${JSON.stringify(pagination)}`)

    throw new Error(`tapSearch(${postId}, ${query}, ${pagination}) called failed: Method not supported.`)
  }

  // #endregion

  // #region Private Methods

  private async getRoomPayload(roomId: string) {
    log.verbose('WechatferryPuppet', `getRoomPayload(${roomId})`)
    const room = await this.roomRawPayload(roomId)
    if (!room) {
      throw new Error(
        `getRoomPayload(${roomId}) called failed: Room not found.`,
      )
    }

    return this.roomRawPayloadParser(room)
  }

  private async getMessagePayload(messageId: string) {
    log.verbose('WechatferryPuppet', `getMessagePayload(${messageId})`)
    const message = await this.messageRawPayload(messageId)
    if (!message) {
      throw new Error(
        `getMessagePayload(${messageId}) called failed: Message not found.`,
      )
    }

    return this.messageRawPayloadParser(message)
  }

  private async getContactPayload(contactId: string) {
    log.verbose('WechatferryPuppet', `getContactPayload(${contactId})`)
    const contact = await this.contactRawPayload(contactId)

    if (!contact) {
      throw new Error(
        `getContact(${contactId}) called failed: Contact not found.`,
      )
    }
    return this.contactRawPayloadParser(contact)
  }

  // TODO: need better way to set temp contact
  async updateContactCache(contactId: string, _contact?: PuppetContact) {
    log.verbose('WechatferryPuppet', `updateContactCache(${contactId})`)
    let contact: WechatferryAgentContact | null = null
    if (_contact) {
      contact = await wechatyContactToWechatferry(_contact)
    }
    else {
      contact = this.agent.getContactInfo(contactId) ?? null
    }
    if (!contact) {
      return null
    }
    await this.cacheManager.setContact(contactId, contact)
    this.dirtyPayload(PUPPET.types.Payload.Contact, contactId)
    return contact
  }

  private async updateRoomCache(roomId: string) {
    log.verbose('WechatferryPuppet', `updateRoomCache(${roomId})`)
    const room = this.agent.getChatRoomInfo(roomId)
    if (!room) {
      return null
    }
    await this.cacheManager.setRoom(roomId, room)
    this.dirtyPayload(PUPPET.types.Payload.Room, roomId)
    return room
  }

  /**
   * 更新群聊成员列表缓存
   *
   * @description 主要用于 room-join 事件前获取新加群的成员
   * @deprecated 尽可能避免使用，优先使用 updateRoomMemberCache
   * @param roomId 群聊 id
   */
  public async updateRoomMemberListCache(roomId: string) {
    log.verbose('WechatferryPuppet', `updateRoomMemberListCache(${roomId})`)
    const members = this.agent.getChatRoomMembers(roomId)
    if (!members) {
      return null
    }
    await this.cacheManager.setRoomMemberList(roomId, members)
    return members
  }

  private async updateRoomMemberCache(roomId: string, contactId: string) {
    log.verbose('WechatferryPuppet', `updateRoomMemberCache(${roomId}, ${contactId})`)
    const { displayNameMap = {} } = await this.roomRawPayload(roomId) ?? {}
    const [member] = this.agent.getChatRoomMembersByMemberIdList([contactId], displayNameMap)
    if (!member) {
      await this.cacheManager.deleteRoomMember(roomId, contactId)
      return null
    }
    this.dirtyPayload(PUPPET.types.Payload.RoomMember, member.userName)
    await this.cacheManager.setRoomMember(roomId, contactId, member)
    return member
  }

  private async loadContactList() {
    log.verbose('WechatferryPuppet', 'loadContactList()')

    const contacts = this.agent.getContactList()
    log.verbose('WechatferryPuppet', `loadContactList: contacts ${contacts.length}`)
    return this.cacheManager.setContactList(contacts)
  }

  private async loadRoomList() {
    log.verbose('WechatferryPuppet', 'loadRoomList()')
    const rooms = this.agent.getChatRoomList()
    log.verbose('WechatferryPuppet', `loadRoomList: rooms ${rooms.length}`)
    await this.cacheManager.setRoomList(rooms)
    await Promise.all(rooms.map(async (room) => {
      const members = this.agent.getChatRoomMembers(room.userName) ?? []
      log.verbose('WechatferryPuppet', `loadRoomMemberList: members ${members.length}`)
      await this.cacheManager.setRoomMemberList(room.userName, members)
    }))
  }

  private startPuppetHeart(firstTime: boolean = true) {
    if (firstTime && this.heartBeatTimer) {
      return
    }

    this.emit('heartbeat', { data: 'heartbeat@wechatferry' })

    this.heartBeatTimer = setTimeout(() => {
      this.startPuppetHeart(false)
    }, 15 * 1000)
  }

  private stopPuppetHeart() {
    if (!this.heartBeatTimer) {
      return
    }

    clearTimeout(this.heartBeatTimer)
    this.heartBeatTimer = undefined
  }
  // #endregion
}

declare module 'wechaty-puppet/payloads' {
  export interface UrlLink {
    /** 左下显示的名字 */
    name?: string
    /** 公众号 id 可以显示对应的头像（gh_ 开头的） */
    account?: string
  }
}
