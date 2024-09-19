import * as PUPPET from 'wechaty-puppet'
import { xmlToJson } from '../utils'
import type { PuppetContact } from '../types'

interface VerifyXmlSchema {
  msg: {
    $: {
      content: string
      scene: string
      ticket: string
      sex: string
      smallheadimgurl: string
      fromusername: string
      fromnickname: string
      encryptusername: string
    }
  }
}

export interface VerifyMessagePayload {
  contact: PuppetContact
  content: string
  scene: string
  ticket: string
  stranger: string
}

export async function parseVerifyMessagePayload(xml?: string) {
  const jsonPayload: VerifyXmlSchema = await xmlToJson(xml ?? '')
  const sex = Number.parseInt(jsonPayload.msg.$.sex)
  const contact = {
    avatar: jsonPayload.msg.$.smallheadimgurl,
    gender: sex,
    id: jsonPayload.msg.$.fromusername,
    name: jsonPayload.msg.$.fromnickname,
    phone: [] as string[],
    tags: [] as string[],
    type: PUPPET.types.Contact.Individual,
    friend: false,
  } as PuppetContact

  return {
    contact,
    content: jsonPayload.msg.$.content,
    scene: jsonPayload.msg.$.scene,
    ticket: jsonPayload.msg.$.ticket,
    stranger: jsonPayload.msg.$.encryptusername,
  } as VerifyMessagePayload
}
