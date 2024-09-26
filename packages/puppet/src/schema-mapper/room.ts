import type { WechatferryAgentChatRoom, WechatferryAgentChatRoomMember } from '@wechatferry/agent'
import type * as PUPPET from 'wechaty-puppet'

export function wechatferryRoomToWechaty(contact: WechatferryAgentChatRoom): PUPPET.payloads.Room {
  return {
    id: contact.userName,
    avatar: contact.smallHeadImgUrl,
    external: false,
    ownerId: contact.ownerUserName || '',
    announce: contact.announcement || '',
    topic: contact.nickName || '',
    adminIdList: [],
    memberIdList: contact.memberIdList,
  }
}

export function wechatferryRoomMemberToWechaty(chatRoomMember: WechatferryAgentChatRoomMember): PUPPET.payloads.RoomMember {
  return {
    avatar: chatRoomMember.smallHeadImgUrl,
    id: chatRoomMember.userName,
    inviterId: chatRoomMember.userName,
    name: chatRoomMember?.remark || chatRoomMember?.nickName,
    roomAlias: chatRoomMember.displayName,
  }
}

declare module 'wechaty-puppet/payloads' {
  export interface Room {
    announce: string
  }
}
