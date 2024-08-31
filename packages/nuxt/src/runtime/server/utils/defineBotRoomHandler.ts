import type { BotHandlerOptions } from './defineBotHandler'
import { defineBotHandler } from './defineBotHandler'
import type { BotHooks } from './useBot'

type PickRoomKeys<T> = {
  [K in keyof T]: K extends `room${string}` ? K : never;
}[keyof T]

type RoomKeys = PickRoomKeys<BotHooks>

export function defineBotRoomHandler(options: BotHandlerOptions<RoomKeys>) {
  const { ..._options } = typeof options === 'function' ? { handler: options } : options
  return defineBotHandler({
    hook: 'room',
    ..._options,
  })
}
