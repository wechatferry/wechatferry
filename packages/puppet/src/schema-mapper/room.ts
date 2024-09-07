import type { WechatferryAgentChatRoom, WechatferryAgentChatRoomMember } from '@wechatferry/agent'
import type * as PUPPET from 'wechaty-puppet'

export function wechatferryRoomToWechaty(contact: WechatferryAgentChatRoom): PUPPET.payloads.Room {
  return {
    id: contact.UserName,
    avatar: contact.smallHeadImgUrl,
    external: false,
    ownerId: contact.ownerUserName || '',
    announce: contact.Announcement || '',
    topic: contact.NickName || '',
    adminIdList: [],
    memberIdList: contact.memberIdList,
  }
}

export function wechatferryRoomMemberToWechaty(chatRoomMember: WechatferryAgentChatRoomMember): PUPPET.payloads.RoomMember {
  return {
    avatar: chatRoomMember.smallHeadImgUrl,
    id: chatRoomMember.UserName,
    inviterId: chatRoomMember.UserName,
    name: chatRoomMember?.Remark || chatRoomMember?.NickName,
    roomAlias: chatRoomMember.DisplayName,
  }
}

declare module 'wechaty-puppet/payloads' {
  export interface Room {
    announce: string
  }
}
