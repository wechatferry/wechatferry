import type { WechatferryAgentEventMessage } from '@wechatferry/agent'
import * as PUPPET from 'wechaty-puppet'
import type { WechatferryPuppet } from '../puppet'
import type { EventPayload } from './events'

const FRIENDSHIP_CONFIRM_REGEX_LIST = [
  /^You have added (.+) as your WeChat contact. Start chatting!$/,
  /^你已添加了(.+)，现在可以开始聊天了。$/,
  /I've accepted your friend request. Now let's chat!$/,
  /^(.+) just added you to his\/her contacts list. Send a message to him\/her now!$/,
  /^(.+)刚刚把你添加到通讯录，现在可以开始聊天了。$/,
  /^我通过了你的朋友验证请求，现在我们可以开始聊天了$/,
]

const FRIENDSHIP_VERIFY_REGEX_LIST = [
  /^(.+) has enabled Friend Confirmation/,
  /^(.+)开启了朋友验证，你还不是他（她）朋友。请先发送朋友验证请求，对方验证通过后，才能聊天。/,
]

function isConfirm(message: string): boolean {
  return FRIENDSHIP_CONFIRM_REGEX_LIST.some((regexp) => {
    return !!message.match(regexp)
  })
}

function isNeedVerify(message: string): boolean {
  return FRIENDSHIP_VERIFY_REGEX_LIST.some((regexp) => {
    return !!message.match(regexp)
  })
}

export async function friendShipParser(puppet: WechatferryPuppet, message: WechatferryAgentEventMessage): Promise<EventPayload> {
  const content = message.content.trim()
  const timestamp = message.ts
  if (isConfirm(content)) {
    return {
      contactId: message.sender,
      id: message.id,
      timestamp,
      type: PUPPET.types.Friendship.Confirm,
    } as PUPPET.payloads.FriendshipConfirm
  }
  else if (isNeedVerify(content)) {
    return {
      contactId: message.sender,
      id: message.id,
      timestamp,
      type: PUPPET.types.Friendship.Verify,
    } as PUPPET.payloads.FriendshipVerify
  }
  return null
}
