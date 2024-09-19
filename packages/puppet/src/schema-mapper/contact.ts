import type { WechatferryAgentContact } from '@wechatferry/agent'
import * as PUPPET from 'wechaty-puppet'
import { isContactCorporationId, isContactOfficialId } from '../utils'

export function wechatferryContactToWechaty(contact: WechatferryAgentContact): PUPPET.payloads.Contact {
  let contactType = PUPPET.types.Contact.Individual

  if (isContactOfficialId(contact.UserName)) {
    contactType = PUPPET.types.Contact.Official
  }
  else if (isContactCorporationId(contact.UserName)) {
    contactType = PUPPET.types.Contact.Corporation
  }

  return {
    alias: contact.Remark,
    avatar: contact.smallHeadImgUrl,
    friend: true,
    gender: 0,
    id: contact.UserName,
    name: contact.NickName,
    phone: [] as string[],
    type: contactType,
    tags: contact.tags,
    handle: contact.Alias,
  }
}

export function wechatyContactToWechatferry(contact: PUPPET.payloads.Contact): WechatferryAgentContact {
  return {
    LabelIDList: '',
    NickName: contact.name,
    PYInitial: '',
    Remark: contact.alias ?? '',
    RemarkPYInitial: '',
    smallHeadImgUrl: contact.avatar,
    tags: [],
    UserName: contact.id,
    Alias: contact.handle,
  }
}

declare module 'wechaty-puppet/payloads' {
  export interface Contact {
    tags: string[]
  }
}
