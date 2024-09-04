/* eslint-disable unused-imports/no-unused-vars */
import { nextTick } from 'node:process'
import { setTimeout } from 'node:timers/promises'
import * as PUPPET from 'wechaty-puppet'
import { log } from 'wechaty-puppet'
import type { Storage, StorageValue } from 'unstorage'
import { createStorage, prefixStorage } from 'unstorage'
import type { FileBoxInterface } from 'file-box'
import { FileBox } from 'file-box'

import type {
  Contact,
  EventMessage,
  EventRoomInvite,
  Message,
} from 'wechaty-puppet/payloads'

import type { UserInfo, WxMsg } from '@wechatferry/core'
import { WechatferryAgent } from '@wechatferry/agent'
import type { PrefixStorage, PuppetContact, PuppetMessage, PuppetRoom, PuppetWcferryOptions, PuppetWcferryUserOptions } from './types'
import { xmlDecrypt, xmlToJson } from './utils'
import { parseAppmsgMessagePayload, parseEmotionMessagePayload, parseMiniProgramMessagePayload, wcfMessageToWechaty } from './messages'

export function resolvePuppetWcferryOptions(userOptions: PuppetWcferryUserOptions): PuppetWcferryOptions {
  return {
    agent: new WechatferryAgent(),
    storage: createStorage(),
    ...userOptions,
  }
}

const VERSION = '3.9.10.27'

export class WechatferryPuppet extends PUPPET.Puppet {
  static override readonly VERSION = VERSION
  agent: WechatferryAgent
  storage: Storage<StorageValue>
  private contactStorage: PrefixStorage<PuppetContact>
  private roomStorage: PrefixStorage<PuppetRoom>
  private messageStorage: PrefixStorage<PuppetMessage>

  constructor(options: PuppetWcferryUserOptions = {}) {
    super()

    const { agent, storage } = resolvePuppetWcferryOptions(options)
    this.agent = agent
    this.storage = storage
    this.contactStorage = this.createPrefixStorage<PuppetContact>(storage, 'contact')
    this.roomStorage = this.createPrefixStorage<PuppetRoom>(storage, 'room')
    this.messageStorage = this.createPrefixStorage<PuppetMessage>(storage, 'message')
  }

  override login(contactId: string) {
    log.verbose('PuppetBridge', 'login(%s)', contactId)

    super.login(contactId)
  }

  override async ding(data?: string | undefined): Promise<void> {
    log.silly('PuppetBridge', 'ding(%s)', data || '')

    await setTimeout(1000)
    this.emit('dong', { data: data || '' })
  }

  // #region Contact

  private async getContact(contactId: string) {
    const contact = await this.contactStorage.hasItem(contactId)
    if (!contact) {
      await this.updateContactPayload({ id: contactId } as any)
    }
    return this.contactStorage.getItem(contactId)
  }

  override contactRawPayloadParser(rawPayload: any): Promise<PUPPET.payloads.Contact>
  override async contactRawPayloadParser(rawPayload: any): Promise<PUPPET.payloads.Contact> {
    return rawPayload
  }

  override contactRawPayload(contactId: string): Promise<Contact | null>
  override contactRawPayload(contactId: string): Promise<Contact | null> {
    log.verbose('PuppetBridge', 'contactRawPayload(%s)', contactId)
    return this.getContact(contactId)
  }

  override contactPayload(contactId: string): Promise<PUPPET.payloads.Contact>
  override async contactPayload(contactId: string): Promise<PUPPET.payloads.Contact | null> {
    log.verbose('PuppetBridge', 'contactPayload(%s)', contactId)
    return this.getContact(contactId)
  }

  override contactAlias(contactId: string): Promise<string>
  override contactAlias(contactId: string, alias: string | null): Promise<void>
  override async contactAlias(contactId: string, alias?: string | null): Promise<void | string> {
    log.verbose('PuppetBridge', 'contactAlias(%s, %s)', contactId, alias || '')
    const contact = await this.contactRawPayload(contactId)
    if (!contact)
      throw new Error('contact not found')

    if (alias) {
      throw new Error('not support set alias')
    }

    return contact.alias
  }

  override contactSearch(
    query?: string | PUPPET.filters.Contact | undefined,
    searchIdList?: string[] | undefined
  ): Promise<string[]>
  override async contactSearch(
    query?: string | PUPPET.filters.Contact | undefined,
    searchIdList?: string[] | undefined,
  ): Promise<string[]> {
    log.verbose('PuppetBridge', 'contactSearch(%s, %s)', query, searchIdList || '')

    const contactList = await this.contactStorage.getItemsList()

    let contacts: string[] = []

    if (typeof query === 'object') {
      if (query.name) {
        contacts = contactList.filter(contact => contact.name === query.name).map(contact => contact.id)
      }
      else if (query.alias) {
        contacts = contactList.filter(contact => contact.alias === query.alias).map(contact => contact.id)
      }
      else if (query.id) {
        contacts = contactList.filter(contact => contact.id === query.id).map(contact => contact.id)
      }
    }
    else if (typeof query === 'string') {
      contacts = contactList
        .filter(contact => contact.id === query || contact.name === query)
        .map(contact => contact.id)
    }
    else {
      contacts = contactList.map(contact => contact.id)
    }

    return contacts
  }

  override contactPhone(contactId: string, phoneList: string[]): Promise<void>
  override contactPhone(contactId: string, phoneList: string[]): Promise<void> {
    log.verbose('PuppetBridge', 'contactPhone(%s, %s)', contactId, phoneList)

    throw new Error('not support set phone')
  }

  override contactList(): Promise<string[]>
  override contactList(): Promise<string[]> {
    log.verbose('PuppetBridge', 'contactList()')
    return this.contactStorage.getKeys()
  }

  override contactAvatar(contactId: string): Promise<FileBoxInterface>
  override contactAvatar(contactId: string, file: FileBoxInterface): Promise<void>
  override async contactAvatar(contactId: string, file?: FileBoxInterface): Promise<void | FileBoxInterface> {
    log.verbose('PuppetBridge', 'contactAvatar(%s, %s)', contactId, file)

    if (file) {
      throw new Error('not support set avatar')
    }

    const contact = await this.contactStorage.getItem(contactId)
    if (!contact)
      throw new Error('contact not found')

    return FileBox.fromUrl(contact.avatar)
  }

  // #endregion

  // #region Room

  // Room --------------

  private async getRoom(roomId: string) {
    const room = await this.roomStorage.hasItem(roomId)
    if (!room) {
      await this.updateRoomPayload({ id: roomId } as any)
    }
    return this.roomStorage.getItem(roomId)
  }

  override async roomAvatar(roomId: string): Promise<FileBoxInterface> {
    log.verbose('PuppetBridge', 'roomAvatar(%s)', roomId)
    const payload = await this.roomPayload(roomId)
    if (!payload.avatar) {
      throw new Error('avatar not set')
    }
    return FileBox.fromUrl(payload.avatar)
  }

  override async roomRawPayloadParser(rawPayload: any): Promise<PUPPET.payloads.Room> {
    log.verbose('PuppetBridge', 'roomRawPayloadParser(%s)', JSON.stringify(rawPayload))
    return rawPayload
  }

  override roomRawPayload(roomId: string): Promise<any> {
    log.verbose('PuppetBridge', 'roomRawPayload(%s)', roomId)
    return this.getRoom(roomId)
  }

  override roomPayload(roomId: string): Promise<PUPPET.payloads.Room>
  override roomPayload(roomId: string): Promise<PUPPET.payloads.Room | null> {
    log.verbose('PuppetBridge', 'roomPayload(%s)', roomId)
    return this.getRoom(roomId)
  }

  override async roomSearch(query?: PUPPET.filters.Room | undefined): Promise<string[]> {
    log.verbose('PuppetBridge', 'roomSearch(%s)', query)

    const roomList = await this.roomStorage.getItemsList()

    let rooms: string[] = []

    if (typeof query === 'object') {
      if (query.id) {
        rooms = roomList.filter(room => room.id === query.id).map(room => room.id)
      }
      else if (query.topic) {
        rooms = roomList.filter(room => room.topic === query.topic).map(room => room.id)
      }
    }
    else {
      rooms = roomList.map(room => room.id)
    }

    return rooms
  }

  override roomList(): Promise<string[]>
  override roomList(): Promise<string[]> {
    log.verbose('PuppetBridge', 'roomList()')
    return this.roomStorage.getKeys()
  }

  override roomMemberList(roomId: string): Promise<string[]>
  override async roomMemberList(roomId: string): Promise<string[]> {
    log.verbose('PuppetBridge', 'roomMemberList(%s)', roomId)

    const room = await this.roomStorage.getItem(roomId)
    if (!room)
      return []

    return room.memberIdList
  }

  override roomMemberPayload(roomId: string, memberId: string): Promise<PUPPET.payloads.RoomMember>
  override async roomMemberPayload(roomId: string, memberId: string): Promise<PUPPET.payloads.RoomMember> {
    log.verbose('PuppetBridge', 'roomMemberPayload(%s, %s)', roomId, memberId)

    const room = await this.roomStorage.getItem(roomId)
    if (!room)
      throw new Error('room not found')

    const member = room.members.find(member => member.id === memberId)
    if (!member)
      throw new Error('member not found')

    return member
  }

  override roomMemberRawPayloadParser(rawPayload: any): Promise<PUPPET.payloads.RoomMember>
  override async roomMemberRawPayloadParser(rawPayload: any): Promise<PUPPET.payloads.RoomMember> {
    return rawPayload
  }

  override roomMemberRawPayload(roomId: string, contactId: string): Promise<any>
  override async roomMemberRawPayload(roomId: string, contactId: string): Promise<any> {
    log.verbose('PuppetBridge', 'roomMemberRawPayload(%s, %s)', roomId, contactId)

    const room = await this.roomStorage.getItem(roomId)
    if (!room)
      return null

    const member = room.members.find(member => member.id === contactId)
    if (!member)
      return null

    return member
  }

  override roomMemberSearch(roomId: string, query: string | symbol | PUPPET.filters.RoomMember): Promise<string[]>
  override async roomMemberSearch(roomId: string, query: string | symbol | PUPPET.filters.RoomMember): Promise<string[]> {
    log.verbose('PuppetBridge', 'roomMemberSearch(%s, %s)', roomId, query)

    const room = await this.roomStorage.getItem(roomId)
    if (!room)
      throw new Error('room not found')

    const memberList = room.members

    let members: string[] = []

    if (typeof query === 'function') {
      members = memberList.filter(query).map(member => member.id)
    }
    else if (typeof query === 'object') {
      if (query.name) {
        members = memberList.filter(member => member.name === query.name).map(member => member.id)
      }
    }
    else if (typeof query === 'string') {
      members = memberList.filter(member => member.name === query).map(member => member.id)
    }
    else {
      members = memberList.map(member => member.id)
    }

    return members
  }

  // #endregion

  // #region Room OPS

  override async roomTopic(roomId: string): Promise<string>
  override async roomTopic(roomId: string, topic: string): Promise<void>
  override async roomTopic(roomId: unknown, topic?: unknown): Promise<string | void> {
    log.verbose('PuppetBridge', 'roomTopic(%s, %s)', roomId, topic || '')
    throw new Error('not support roomTopic')
  }

  override roomAnnounce(roomId: string): Promise<string>
  override roomAnnounce(roomId: string, text: string): Promise<void>
  override roomAnnounce(roomId: unknown, text?: unknown): Promise<void> | Promise<string> {
    log.verbose('PuppetBridge', 'roomAnnounce(%s, %s)', roomId, text || '')
    throw new Error('not support roomAnnounce')
  }

  override async roomAdd(roomId: string, contactId: string): Promise<void> {
    log.verbose('PuppetBridge', 'roomAdd(%s, %s)', roomId, contactId)

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

  override async roomDel(roomId: string, contactId: string): Promise<void> {
    log.verbose('PuppetBridge', 'roomDel(%s, %s)', roomId, contactId)

    if (!roomId || !contactId) {
      log.error('roomDel: roomId or contactId not found')
      return
    }

    this.agent.removeChatRoomMembers(roomId, contactId)
  }

  override roomQuit(roomId: string): Promise<void> {
    log.verbose('PuppetBridge', 'roomQuit(%s)', roomId)
    throw new Error('not support roomQuit')
  }

  override roomCreate(contactIdList: string[], topic?: string | undefined): Promise<string> {
    log.verbose('PuppetBridge', 'roomCreate(%s, %s)', contactIdList, topic || '')
    throw new Error('not support roomCreate')
  }

  // #endregion

  // #region Room Invitation

  override roomInvitationRawPayload(roomInvitationId: string): Promise<any> {
    log.verbose('PuppetBridge', 'roomInvitationRawPayload(%s)', roomInvitationId)
    return this.messageStorage.getItem(roomInvitationId)
  }

  override roomInvitationRawPayloadParser(rawPayload: any): Promise<PUPPET.payloads.RoomInvitation> {
    log.verbose('PuppetBridge', 'roomInvitationRawPayloadParser(%s)', JSON.stringify(rawPayload))
    return rawPayload
  }

  override async roomInvitationAccept(roomInvitationId: string): Promise<void> {
    log.verbose('PuppetBridge', 'roomInvitationAccept(%s)', roomInvitationId)
    const message = await this.messageStorage.getItem(roomInvitationId)
    if (!message)
      throw new Error('message not found')

    const content = await xmlDecrypt(message.text || '', message.type)
    if (!content)
      throw new Error('content not found')

    const url = content?.url as string
    if (!url)
      throw new Error('url not found')

    throw new Error('not support roomInvitationAccept')
  }

  // #endregion

  // #region Tag

  override tagContactAdd(tagId: string, contactId: string): Promise<void> {
    log.verbose('PuppetBridge', 'tagContactAdd(%s, %s)', tagId, contactId)
    throw new Error('not support tagContactAdd')
  }

  override tagContactDelete(tagId: string): Promise<void> {
    log.verbose('PuppetBridge', 'tagContactDelete(%s)', tagId)
    throw new Error('not support tagContactDelete')
  }

  override tagContactList(contactId: string): Promise<string[]>
  override tagContactList(): Promise<string[]>
  override async tagContactList(contactId?: string): Promise<string[]> {
    log.verbose('PuppetBridge', 'tagContactList(%s)', contactId)
    if (contactId) {
      const contact = await this.contactStorage.getItem(contactId)
      return contact?.tags || []
    }
    return this.agent.getTagList().map(v => v.LabelID)
  }

  override tagContactRemove(tagId: string, contactId: string): Promise<void> {
    log.verbose('PuppetBridge', 'tagContactDelete(%s)', tagId)
    throw new Error('not support tagContactRemove')
  }

  // #endregion

  // #region Message

  override messageRawPayload(messageId: string): Promise<any>
  override async messageRawPayload(messageId: string): Promise<any> {
    log.verbose('PuppetBridge', 'messageRawPayload(%s)', messageId)
    return this.messageStorage.getItem(messageId)
  }

  override messageRawPayloadParser(rawPayload: any): Promise<PUPPET.payloads.Message>
  override async messageRawPayloadParser(rawPayload: any): Promise<PUPPET.payloads.Message> {
    log.verbose('PuppetBridge', 'messageRawPayloadParser(%s)', JSON.stringify(rawPayload))
    return rawPayload
  }

  override messagePayload(messageId: string): Promise<PUPPET.payloads.Message>
  override async messagePayload(messageId: string): Promise<PUPPET.payloads.Message> {
    log.verbose('PuppetBridge', 'messagePayload(%s)', messageId)
    const message = await this.messageStorage.getItem(messageId)
    if (!message)
      throw new Error('message not found')
    return message
  }

  override async messageContact(messageId: string): Promise<string>
  override async messageContact(messageId: string): Promise<string> {
    log.verbose('PuppetBridge', 'messageContact(%s)', messageId)
    const message = await this.messageStorage.getItem(messageId)
    if (!message)
      throw new Error('message not found')
    return await xmlDecrypt(message.text || '', message.type || PUPPET.types.Message.Unknown)
  }

  private getImageFileConfig(imageType: PUPPET.types.Image) {
    if (imageType === PUPPET.types.Image.Thumbnail) {
      return {
        fileType: 3,
        attr: 'cdnthumburl',
        suffix: 'thumb',
      }
    }
    if (imageType === PUPPET.types.Image.HD) {
      return {
        fileType: 2,
        attr: 'cdnmidimgurl',
        suffix: 'hd',
      }
    }
    return {
      fileType: 1,
      attr: 'cdnbigimgurl',
      suffix: 'normal',
    }
  }

  override async messageImage(messageId: string, imageType: PUPPET.types.Image): Promise<FileBoxInterface>
  override async messageImage(messageId: string, imageType: PUPPET.types.Image): Promise<FileBoxInterface> {
    log.verbose('PuppetBridge', 'messageImage(%s, %s)', messageId, imageType)

    const message = await this.messageStorage.getItem(messageId)
    if (!message)
      throw new Error('message not found')

    try {
      const content = await xmlToJson(message.text || '', { mergeAttrs: true, explicitArray: false })

      const { fileType, suffix, attr } = this.getImageFileConfig(imageType)

      const aeskey = content.msg.img.aeskey
      const cdnUrl = content.msg.img[attr] || content.msg.img.cdnmidimgurl

      const fileName = `message_${aeskey}_${suffix}.png`
      // TODO: download image
    }
    catch (error: any) {
      log.error(
        'PuppetBridge',
        'messageImage() exception %s',
        error.stack,
      )
    }

    throw new Error('not support messageImage')
  }

  override messageRecall(messageId: string): Promise<boolean>
  override messageRecall(messageId: string): Promise<boolean> {
    log.verbose('PuppetBridge', 'messageRecall(%s)', messageId)

    throw new Error('not support messageRecall')
  }

  private async getMessageFileBox(message: PUPPET.payloads.Message): Promise<FileBoxInterface> {
    log.verbose('PuppetBridge', 'messageFileBox(%s)', message.id)

    const configMapping = {
      [PUPPET.types.Message.Video]: {
        attr: 'videomsg',
        suffix: '.mp4',
        fileTye: 4,
      },
      [PUPPET.types.Message.Audio]: {
        attr: 'voicemsg',
        suffix: '.slik',
        fileTye: 15,
      },
    } as Record<PUPPET.types.Message, { attr: string, suffix: string, fileTye: number }>
    const config = configMapping[message.type]

    try {
      const content = await xmlToJson(message.text || '', { mergeAttrs: true, explicitArray: false })

      const aeskey = content.msg[config.attr].aeskey
      const cdnUrl = content.msg[config.attr].cdnvideourl
      const fileName = `message_${aeskey}${config.suffix}`
      // TODO: download file
    }
    catch (error: any) {
      log.error(
        'PuppetBridge',
        'getMessageFileBox() exception %s',
        error.stack,
      )
    }

    throw new Error('not support getMessageFileBox')
  }

  private async getMessageAttachment(message: PUPPET.payloads.Message): Promise<FileBoxInterface> {
    log.verbose('PuppetBridge', 'getMessageAttachment(%s)', message.id)

    try {
      const content = await xmlToJson(message.text || '', { ignoreAttrs: true, explicitArray: false })

      const title = content.msg.appmsg.title
      const totallen = content.msg.appmsg.appattach.totallen
      const aeskey = content.msg.appmsg.appattach.aeskey
      const cdnUrl = content.msg.appmsg.appattach.cdnattachurl

      const fileName = `message_${aeskey}_${title}`
      // TODO: download file
    }
    catch (error: any) {
      log.error(
        'PuppetBridge',
        'getMessageAttachment() exception %s',
        error.stack,
      )
    }
    throw new Error('not support getMessageAttachment')
  }

  private async getMessageEmoticon(message: PUPPET.payloads.Message): Promise<FileBoxInterface> {
    log.verbose('PuppetBridge', 'messageEmoticon(%s)', message.id)

    try {
      const emotionPayload = await parseEmotionMessagePayload(message)
      const emoticonBox = FileBox.fromUrl(emotionPayload.cdnurl, { name: `message-${message.id}-emoticon.jpg` })

      return emoticonBox
    }
    catch (error: any) {
      log.error(
        'PuppetBridge',
        'getMessageEmoticon() exception %s',
        error.stack,
      )
    }

    throw new Error('can\'t get emoticon')
  }

  override async messageFile(messageId: string): Promise<FileBoxInterface>
  override async messageFile(messageId: string): Promise<FileBoxInterface> {
    log.verbose('PuppetBridge', 'messageFile(%s)', messageId)

    const message = await this.messageStorage.getItem(messageId)
    if (!message)
      throw new Error('message not found')

    if (message?.type === PUPPET.types.Message.Image) {
      return this.messageImage(messageId, PUPPET.types.Image.HD)
    }

    if (message.type === PUPPET.types.Message.Emoticon) {
      return this.getMessageEmoticon(message)
    }

    if (message.type === PUPPET.types.Message.Video || message.type === PUPPET.types.Message.Audio) {
      return this.getMessageFileBox(message)
    }

    if (message.type === PUPPET.types.Message.Attachment) {
      return this.getMessageAttachment(message)
    }

    log.verbose(`messageFile unknown type: ${message.type}`)

    throw new Error('can\'t get file')
  }

  override async messageUrl(messageId: string): Promise<PUPPET.payloads.UrlLink>
  override async messageUrl(messageId: string): Promise<PUPPET.payloads.UrlLink> {
    log.verbose('PuppetBridge', 'messageUrl(%s)', messageId)

    const message = await this.messageStorage.getItem(messageId)
    if (!message)
      throw new Error('message not found')

    const appPayload = await parseAppmsgMessagePayload(message.text || '')
    return {
      description: appPayload.des,
      thumbnailUrl: appPayload.thumburl,
      title: appPayload.title,
      url: appPayload.url,
    }
  }

  override async messageMiniProgram(messageId: string): Promise<PUPPET.payloads.MiniProgram>
  override async messageMiniProgram(messageId: string): Promise<PUPPET.payloads.MiniProgram> {
    log.verbose('PuppetBridge', 'messageMiniProgram(%s)', messageId)

    const message = await this.messageStorage.getItem(messageId)
    if (!message)
      throw new Error('message not found')

    return parseMiniProgramMessagePayload(message)
  }

  override async messageLocation(messageId: string): Promise<PUPPET.payloads.Location>
  override async messageLocation(messageId: string): Promise<PUPPET.payloads.Location> {
    log.verbose('PuppetBridge', 'messageLocation(%s)', messageId)

    const message = await this.messageStorage.getItem(messageId)
    if (!message)
      throw new Error('message not found')

    return await xmlDecrypt(message?.text || '', message?.type || PUPPET.types.Message.Unknown)
  }

  // #endregion

  // #region Send

  override async messageSendText(
    conversationId: string,
    text: string,
    mentionIdList?: string[] | undefined
  ): Promise<string | void>
  override async messageSendText(
    conversationId: string,
    text: string,
    mentionIdList?: string[] | undefined,
  ): Promise<string | void> {
    log.verbose('PuppetBridge', 'messageSendText(%s, %s, %s)', conversationId, text, mentionIdList)

    if (!conversationId.includes('@chatroom')) {
      log.verbose('messageSendText', 'normal text')
      this.agent.sendText(conversationId, text)
      return
    }

    if (text.includes('@all')) {
      log.verbose('messageSendText', 'at all')
      text = text.replace('@all', '@所有人').trim()
      await this.agent.sendText(conversationId, text, ['notify@all'])
    }
    else if (/@\[mention:[^\]]+\]/.test(text)) {
      log.verbose('messageSendText', 'at mention')
      const { mentions, message } = this.mentionTextParser(text)
      const mentionText = this.getMentionText(conversationId, mentions)
      await this.agent.sendText(`${mentionText} ${message}`, conversationId, mentions)
    }
    else {
      log.verbose('messageSendText', 'normal text')
      await this.agent.sendText(conversationId, text)
    }
  }

  override async messageSendFile(conversationId: string, file: FileBoxInterface): Promise<string | void>
  override async messageSendFile(conversationId: string, file: FileBoxInterface): Promise<string | void> {
    log.verbose('PuppetBridge', 'messageSendFile(%s, %s)', conversationId, file)
    if (file.mediaType.startsWith('image')) {
      await this.agent.sendImage(conversationId, file)
    }
    else {
      await this.agent.sendFile(conversationId, file)
    }
  }

  override messageSendUrl(conversationId: string, urlLinkPayload: PUPPET.payloads.UrlLink): Promise<string | void>
  override async messageSendUrl(conversationId: string, urlLinkPayload: PUPPET.payloads.UrlLink): Promise<string | void> {
    log.verbose('PuppetBridge', 'messageSendUrl(%s, %s)', conversationId, urlLinkPayload)
    this.agent.sendRichText(conversationId, {
      title: urlLinkPayload.title,
      digest: urlLinkPayload.description,
      thumburl: urlLinkPayload.thumbnailUrl,
      url: urlLinkPayload.url,
      name: urlLinkPayload.name,
      account: urlLinkPayload.account,
    })
  }

  override async messageSendContact(conversationId: string, contactId: string): Promise<string | void>
  override async messageSendContact(conversationId: string, contactId: string): Promise<string | void> {
    log.verbose('PuppetBridge', 'messageSendContact(%s, %s)', conversationId, contactId)
    // TODO: 发送联系人
    throw new Error('not support messageSendContact')
  }

  override messageSendMiniProgram(
    conversationId: string,
    miniProgramPayload: PUPPET.payloads.MiniProgram
  ): Promise<string | void>
  override async messageSendMiniProgram(
    conversationId: string,
    miniProgramPayload: PUPPET.payloads.MiniProgram,
  ): Promise<string | void> {
    log.verbose('PuppetBridge', 'messageSendMiniProgram(%s, %s)', conversationId, miniProgramPayload)
    // TODO: 发送小程序
    throw new Error('not support messageSendMiniProgram')
  }

  override messageForward(conversationId: string, messageId: string): Promise<string | void>
  override async messageForward(conversationId: string, messageId: string): Promise<string | void> {
    log.verbose('PuppetBridge', 'messageForward(%s, %s)', conversationId, messageId)
    this.agent.forwardMsg(conversationId, messageId)
  }

  override messageSendLocation(
    conversationId: string,
    locationPayload: PUPPET.payloads.Location
  ): Promise<string | void>
  override async messageSendLocation(
    conversationId: string,
    locationPayload: PUPPET.payloads.Location,
  ): Promise<string | void> {
    log.verbose('PuppetBridge', 'messageSendLocation(%s, %s)', conversationId, locationPayload)

    // TODO: 发送位置
    throw new Error('not support messageSendMiniProgram')
  }

  override messageSendPost(conversationId: string, postPayload: PUPPET.payloads.Post): Promise<string | void>
  override async messageSendPost(conversationId: string, postPayload: PUPPET.payloads.Post): Promise<string | void> {
    log.verbose('PuppetBridge', 'messageSendPost(%s, %s)', conversationId, postPayload)
    // TODO: send post
    throw new Error('not support messageSendPost')
  }

  // #endregion

  // #region Core

  async onStart() {
    this.agent.on('message', this.onMessage.bind(this))
    this.agent.on('login', this.onLogin.bind(this))
    this.agent.start()
  }

  async onStop() {
    this.agent.stop()
  }

  async onLogin(user: UserInfo) {
    log.verbose('PuppetBridge', 'onLogin() user %s', JSON.stringify(user))
    await this.loadContacts()
    await this.loadRooms()
    await this.updateContactPayload({ id: user.wxid } as PuppetContact, true)
    this.login(user.wxid)
    nextTick(() => this.emit('ready'))
  }

  async onMessage(message: WxMsg) {
    log.verbose('PuppetBridge', 'onMessage()')

    if (!message)
      return

    return this.msgHandler(message)
  }

  async msgHandler(message: WxMsg) {
    const payload = await wcfMessageToWechaty(this, message)
    const { roomId } = payload

    if (roomId && !await this.roomStorage.hasItem(roomId)) {
      await this.updateRoomPayload({
        id: roomId,
      } as PuppetRoom)
    }

    if (this.isInviteMsg(payload)) {
      this.inviteMsgHandler(payload)
      await this.messageStorage.setItem(payload.id, payload)
    }
    else if (this.isRoomOps(message)) {
      await this.roomMsgHandler(payload)
    }
    else {
      await this.messageStorage.setItem(payload.id, payload)
      this.emit('message', { messageId: payload.id } as EventMessage)
    }
  }

  private async roomMsgHandler(message: Message) {
    log.verbose('PuppetBridge', 'roomMsgHandler()  message %s', JSON.stringify(message))

    const { roomId, text } = message
    if (!text || !roomId)
      return

    const actions = [
      { check: '修改群名为', handler: this.handleRoomTopicChange },
      { check: '添加为群管理员', handler: this.handleRoomAdminAdd },
      { check: '移出了群聊', handler: this.handleRoomLeave },
      { check: '分享的二维码加入群聊', handler: this.handleQrCodeJoin },
      { check: '加入了群聊', handler: this.handleInviteJoin },
    ]

    for (const action of actions) {
      if (text.includes(action.check)) {
        return await action.handler.call(this, roomId, text)
      }
    }
  }

  /**
   * 处理群名称修改事件
   *
   * 注意这里的群名是全角引号
   * @example `"小茸茸"修改群名为“三花AI摆摊”`
   * @example `你修改群名为“三花AI摆摊”`
   */
  private async handleRoomTopicChange(roomId: string, text: string) {
    log.verbose('PuppetBridge', 'handleRoomTopicChange(%s, %s)', roomId, text)
    const room = await this.getRoom(roomId) as PuppetRoom
    const [changerName, newTopic] = text.trim().split('修改群名为').filter(v => v)
    const changer = await this.findMemberByNickName(changerName, room)
    if (!changer) {
      log.error(`handleRoomTopicChange: changer ${changerName} not found`)
      return
    }
    const oldTopic = room.topic || ''
    const topic = newTopic?.split(/[“”"]/)[1] || ''

    room.topic = topic
    await this.roomStorage.setItem(roomId, room)
    this.emit('room-topic', { changerId: changer.id, newTopic: topic, oldTopic, roomId, timestamp: Date.now() })
  }

  /**
   * 处理群管理员添加事件
   *
   * @example `你将"小茸茸"添加为群管理员`
   * @example `"小茸茸"将"小茸茸"添加为群管理员`
   * @example `"小茸茸"将"小茸茸1、小茸茸2"添加为群管理员`
   */
  private async handleRoomAdminAdd(roomId: string, text: string) {
    log.verbose('PuppetBridge', 'handleRoomAdminAdd(%s, %s)', roomId, text)
    const room = await this.getRoom(roomId) as PuppetRoom
    const [operatorName, ...adminNameList] = text.trim().split(/将|、|添加为群管理员/).filter(v => v)
    const operator = await this.findMemberByNickName(operatorName, room)
    if (!operator) {
      log.error(`handleRoomAdminAdd: operator ${operatorName} not found`)
      return
    }
    const adminIdListPromises = adminNameList.map(async (name) => {
      const member = await this.findMemberByNickName(name, room)
      return member?.id as string
    })
    const adminIdList = (await Promise.all(adminIdListPromises)).filter(v => v)
    if (!adminIdList.length) {
      log.error(`handleRoomAdminAdd: admin ${adminNameList} not found`)
      return
    }
    this.emit('room-admin', { adminIdList, operatorId: operator.id, roomId, timestamp: Date.now() })
  }

  /**
   * 处理群成员移出事件
   *
   * @example `你将"小茸茸"移出了群聊`
   * @example `"小茸茸"将"小茸茸"移出了群聊`
   * @example `"小茸茸"将"小茸茸1、小茸茸2"移出了群聊`
   */
  private async handleRoomLeave(roomId: string, text: string) {
    log.verbose('PuppetBridge', 'handleRoomLeave(%s, %s)', roomId, text)
    const room = await this.getRoom(roomId) as PuppetRoom
    const [removerName, ...removeeNameList] = text.trim().split(/将|、|移出了群聊/).filter(v => v)
    const remover = await this.findMemberByNickName(removerName, room)
    if (!remover) {
      log.error(`handleRoomLeave: operator ${removerName} not found`)
      return
    }
    const removeeIdListPromises = removeeNameList.map(async (name) => {
      const member = await this.findMemberByNickName(name, room)
      return member?.id as string
    })
    const removeeIdList = (await Promise.all(removeeIdListPromises)).filter(v => v)
    if (!removeeIdList.length) {
      log.error(`handleRoomLeave: removee ${removeeNameList} not found`)
      return
    }

    this.emit('room-leave', { removeeIdList, removerId: remover.id, roomId, timestamp: Date.now() })
  }

  /**
   * 处理群成员扫码加入事件
   *
   * @example `"小茸茸"通过扫描你分享的二维码加入群聊`
   * @example `"小茸茸"通过扫描"小茸茸"分享的二维码加入群聊`
   */
  private async handleQrCodeJoin(roomId: string, text: string, retries = 5) {
    log.verbose('PuppetBridge', 'handleQrCodeJoin(%s, %s)', roomId, text)
    const room = await this.getRoom(roomId) as PuppetRoom
    const [inviteeName, inviterName] = text.trim().split(/通过扫描|分享的二维码加入群聊/).filter(v => v)
    const inviter = await this.findMemberByNickName(inviterName, room)
    if (!inviter) {
      log.error(`handleQrCodeJoin: inviter ${inviterName} not found`)
      return
    }
    // TODO: 扫码加群的新成员有可能立即获取不到，也许需要等待一会，需要再观察一下
    const invitee = await this.findMemberByNickName(inviteeName, room)
    if (!invitee) {
      log.error(`handleQrCodeJoin: invitee ${inviteeName} not found`)
      if (retries <= 0)
        return
      log.error(`handleQrCodeJoin: retrying ${retries} times`)
      await setTimeout(1000)
      await this.handleQrCodeJoin(roomId, text, retries - 1)
      return
    }
    this.emit('room-join', { inviteeIdList: [invitee.id], inviterId: inviter.id, roomId, timestamp: Date.now() })
  }

  /**
   * 处理群成员邀请加入事件
   *
   * @example `你邀请"小茸茸"加入了群聊`
   * @example `"小茸茸"邀请"小茸茸"加入了群聊`
   * @example `"小茸茸"邀请"小茸茸1、小茸茸2"加入了群聊`
   */
  private async handleInviteJoin(roomId: string, text: string) {
    log.verbose('PuppetBridge', 'handleInviteJoin(%s, %s)', roomId, text)
    const room = await this.getRoom(roomId) as PuppetRoom
    const [inviterName, ...inviteeNameList] = text.trim().split(/邀请|、|加入了群聊/).filter(v => v)
    const inviter = await this.findMemberByNickName(inviterName, room)
    if (!inviter) {
      log.error(`handleInviteJoin: operator ${inviterName} not found`)
      return
    }
    const inviteeIdListPromises = inviteeNameList.map(async (name) => {
      const member = await this.findMemberByNickName(name, room)
      return member?.id as string
    })
    const inviteeIdList = (await Promise.all(inviteeIdListPromises)).filter(v => v)
    if (!inviteeIdList.length) {
      log.error(`handleInviteJoin: invitee ${inviteeNameList} not found`)
      return
    }
    this.emit('room-join', { inviteeIdList, inviterId: inviter.id, roomId, timestamp: Date.now() })
  }

  /**
   * 被邀请入群消息处理
   */
  private inviteMsgHandler = (message: Message) => {
    log.verbose('PuppetBridge', 'inviteMsgHandler()  message %s', JSON.stringify(message))

    this.emit('room-invite', {
      roomInvitationId: message.id,
    } as EventRoomInvite)
  }

  // #endregion

  // #region Storage
  private async updateRoomPayload(room: PuppetRoom, forceUpdate = false): Promise<void> {
    log.verbose('PuppetBridge', 'updateRoomPayload()')

    if (!room)
      return

    const exist = await this.roomStorage.hasItem(room.id)
    if (exist && !forceUpdate)
      return
    try {
      const roomInfo = this.agent.getChatRoomInfo(room.id)
      if (!roomInfo)
        return
      room = this.formatRoom(roomInfo)
      await this.roomStorage.setItem(room.id, room)
    }
    catch (error: any) {
      log.error(
        'PuppetBridge',
        'updateRoomPayload() exception %s',
        error.stack,
      )
    }
  }

  private async updateContactPayload(
    contact: PuppetContact,
    forceUpdate = false,
  ): Promise<void> {
    log.verbose('PuppetBridge', 'updateContactPayload()')

    if (!contact)
      return

    const exist = await this.contactStorage.hasItem(contact.id)
    if (exist && !forceUpdate)
      return

    try {
      const contactInfo = this.agent.getContactInfo(contact.id)
      if (!contactInfo)
        return
      contact = this.formatContact(contactInfo)
      await this.contactStorage.setItem(contact.id, contact)
    }
    catch (error) {
      log.error('PuppetBridge', 'updateContactPayload() exception %s', error)
    }
  }

  private async loadContacts() {
    log.verbose('PuppetBridge', 'loadContacts()')
    try {
      const contacts = this.agent.getContactList()

      for (const contactInfo of contacts) {
        const contact = this.formatContact(contactInfo)
        await this.contactStorage.setItem(contact.id, contact)
      }

      log.verbose(
        'PuppetBridge',
        'loadContacts() contacts count %s',
        contacts.length,
      )
    }
    catch (error: any) {
      log.error('PuppetBridge', 'loadContacts() exception %s', error.stack)
    }
  }

  private async loadRooms(): Promise<void> {
    log.verbose('PuppetBridge', 'loadRooms()')
    try {
      const roomsData = this.agent.getChatRoomDetailList()

      if (!roomsData)
        throw new Error('no rooms data')

      for (const room of roomsData) {
        const data = this.formatRoom(room)
        await this.roomStorage.setItem(room.UserName, data)
      }
      log.verbose(
        'PuppetBridge',
        'loadRooms() rooms count %s',
        (await this.roomStorage.getKeys()).length,
      )
    }
    catch (error: any) {
      log.error('PuppetBridge', 'loadRooms() exception %s', error.stack)
    }
  }
  // #endregion

  // #region Utils
  private createPrefixStorage<T extends StorageValue>(storage: Storage<T>, base: string) {
    const s = prefixStorage(storage, base)

    const getItemsMap = async (base?: string) => {
      const keys = await s.getKeys(base)
      return await Promise.all(keys.map(async key => ({ key, value: await s.getItem(key) as T })))
    }
    return {
      ...s,
      getItemsMap,
      async getItemsList(base?: string) {
        return (await getItemsMap(base)).map(v => v.value)
      },
    }
  }

  private isRoomOps = (message: WxMsg) => {
    const type = message.type.valueOf()
    return [10000, 10002].includes(type)
  }

  /**
   * 判断是否是邀请入群消息
   *
   * @example `"小茸茸"邀请你和"小茸茸"加入了群聊`
   * @example `"小茸茸"邀请你加入了群聊`
   */
  private isInviteMsg = (message: Message) => {
    const type = message.type.valueOf()
    return type === 10000 && /邀请你和?.*?加入了群聊/.test(message.text ?? '')
  }

  private findMemberByRoomAliasOrName = (name: string, room: PuppetRoom) => {
    const members = room.members || []
    return members.find(member => member.roomAlias === name || member.name === name)
  }

  private findMemberByNickName = async (userName: string, room: PuppetRoom) => {
    const name = userName.split(/[“”"]/)[1] || ''
    if (!this.findMemberByRoomAliasOrName(name, room)) {
      await this.updateRoomPayload(room, true)
    }
    room = await this.roomStorage.getItem(room.id) as PuppetRoom
    if (!room)
      return
    return this.findMemberByRoomAliasOrName(name, room)
  }

  private formatContact<T extends Exclude<ReturnType<typeof this.agent.getContactInfo>, undefined>>(contactInfo: T): PuppetContact {
    let contactType = PUPPET.types.Contact.Individual

    if (contactInfo.UserName.startsWith('gh_')) {
      contactType = PUPPET.types.Contact.Official
    }
    if (contactInfo.UserName.startsWith('@openim')) {
      contactType = PUPPET.types.Contact.Corporation
    }
    return {
      id: contactInfo.UserName,
      name: contactInfo.NickName,
      type: contactType,
      friend: true,
      phone: [] as string[],
      avatar: contactInfo.smallHeadImgUrl,
      tags: contactInfo.tags,
      gender: 0,
    }
  }

  private formatRoom<T extends Exclude<ReturnType<typeof this.agent.getChatRoomInfo>, undefined>>(roomInfo: T): PuppetRoom {
    const memberList = this.agent.getChatRoomMembersByMemberIdList(roomInfo.memberIdList, roomInfo.displayNameMap)
    const members = memberList.map(m => ({
      id: m?.UserName,
      roomAlias: m?.DisplayName,
      avatar: m?.smallHeadImgUrl,
      name: m?.Remark || m?.NickName,
    }))
    return {
      id: roomInfo.UserName,
      avatar: roomInfo.smallHeadImgUrl,
      external: false,
      ownerId: roomInfo.ownerUserName || '',
      announce: roomInfo.Announcement || '',
      topic: roomInfo.NickName || '',
      adminIdList: [],
      memberIdList: roomInfo.memberIdList,
      members,
    }
  }

  private mentionTextParser(message: string): { mentions: string[], message: string } {
    const mentionRegex = /@\[mention:([^\]]+)\]/g
    const mentions = message.match(mentionRegex) || []

    const mentionIds = mentions.map((mention) => {
      const match = mention.match(/@\[mention:([^\]]+)\]/)
      return match && match.length > 1 ? match[1] : null
    })

    const text = message.replace(mentionRegex, '').trim()

    return {
      mentions: mentionIds.filter(id => id) as string[],
      message: text,
    }
  }

  private async getMentionText(roomId: string, mentions: string[]) {
    let mentionText = ''

    if (mentions.length === 0)
      return mentionText

    const chatroom = await this.roomStorage.getItem(roomId)
    if (!chatroom)
      throw new Error('chatroom not found')

    const chatroomMembers = chatroom.members

    mentionText = mentions.reduce((acc, mentionId) => {
      chatroomMembers.filter((member) => {
        if (member.id === mentionId) {
          acc += `@${member.name} `
          return true
        }
        return false
      })

      return acc
    }, '')

    return mentionText
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
