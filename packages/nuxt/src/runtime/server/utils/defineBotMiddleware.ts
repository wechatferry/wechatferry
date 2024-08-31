import type { BotHandlerObject, BotHooksKeys } from './defineBotHandler'

export type BotMiddleware<H extends BotHooksKeys> = Pick<BotHandlerObject<H>, 'hook' | 'handler'>

export function defineBotMiddleware<H extends BotHooksKeys>(middleware: BotMiddleware<H>) {
  return middleware
}
