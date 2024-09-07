import * as PUPPET from 'wechaty-puppet'
import { xmlToJson } from '../utils'

interface ContactCardXmlSchema {
  msg: {
    $: {
      bigheadimgurl: string
      smallheadimgurl: string
      username: string
      nickname: string
      fullpy: string
      shortpy: string
      alias: string
      imagestatus: string
      scene: string
      province: string
      city: string
      sign: string
      sex: string
      certflag: string
      certinfo: string
      brandIconUrl: string
      brandHomeUrl: string
      brandSubscriptConfigUrl: string
      brandFlags: string
      regionCode: string
      biznamecardinfo: string
      antispamticket: string
    }
  }
}

export async function parseContactCardMessagePayload(messageContent: string) {
  const jsonPayload = await xmlToJson<ContactCardXmlSchema>(messageContent)
  const { $: { bigheadimgurl, username, nickname, city, province } } = jsonPayload.msg

  return {
    avatar: bigheadimgurl,
    id: username,
    gender: 0,
    name: nickname,
    friend: false,
    province,
    city,
    phone: [],
    tags: [],
    type: PUPPET.types.Contact.Unknown,
  } as PUPPET.payloads.Contact
}
