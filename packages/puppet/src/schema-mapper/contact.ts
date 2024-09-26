import type { WechatferryAgentContact } from '@wechatferry/agent'
import * as PUPPET from 'wechaty-puppet'
import { isContactCorporationId, isContactOfficialId } from '../utils'

export function wechatferryContactToWechaty(contact: WechatferryAgentContact): PUPPET.payloads.Contact {
  let contactType = PUPPET.types.Contact.Individual

  if (isContactOfficialId(contact.userName)) {
    contactType = PUPPET.types.Contact.Official
  }
  else if (isContactCorporationId(contact.userName)) {
    contactType = PUPPET.types.Contact.Corporation
  }

  return {
    alias: contact.remark,
    avatar: contact.smallHeadImgUrl,
    friend: true,
    gender: 0,
    id: contact.userName,
    name: contact.nickName,
    phone: [] as string[],
    type: contactType,
    tags: contact.tags,
    handle: contact.alias,
  }
}

export function wechatyContactToWechatferry(contact: PUPPET.payloads.Contact): WechatferryAgentContact {
  return {
    labelIdList: '',
    nickName: contact.name,
    pinYinInitial: '',
    remark: contact.alias ?? '',
    remarkPinYinInitial: '',
    smallHeadImgUrl: contact.avatar,
    tags: [],
    userName: contact.id,
    alias: contact.handle,
  }
}

declare module 'wechaty-puppet/payloads' {
  export interface Contact {
    tags: string[]
  }
}
