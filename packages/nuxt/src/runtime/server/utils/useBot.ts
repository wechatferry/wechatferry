import type { Message } from 'wechaty'
import { WechatyBuilder } from 'wechaty'
import type { ContactInterface, RoomInterface, RoomInvitationInterface, WechatyInterface } from 'wechaty/impls'
import type { Hookable } from 'hookable'
import { createHooks } from 'hookable'
import { useBotPuppet } from './useBotPuppet'

export interface BotHooks {
  'message': (msg: Message) => void
  'message:room': (msg: Message) => void
  'message:room:mention': (msg: Message) => void
  'message:contact': (msg: Message) => void
  'room': (room: RoomInterface, ...args: unknown[]) => void
  'room:join': (room: RoomInterface, inviteeList: ContactInterface[], inviter: ContactInterface, date?: Date | undefined) => void
  'room:leave': (room: RoomInterface, leaverList: ContactInterface[], remover?: ContactInterface | undefined, date?: Date | undefined) => void
  'room:topic': (room: RoomInterface, newTopic: string, oldTopic: string, changer: ContactInterface, date?: Date | undefined) => void
  'room:invite': (room: RoomInvitationInterface) => void
}

let bot: WechatyInterface & {
  hooks: Hookable<BotHooks>
}

export function useBot(): typeof bot {
  const puppet = useBotPuppet()
  if (!bot) {
    const _bot = WechatyBuilder.build({ puppet })
    // @ts-expect-error ignore
    bot = Object.assign(_bot, { hooks: createHooks() })
  }

  return bot
}
