import type { Message } from 'wechaty'
import { defineBotMessageHandler } from './defineBotMessageHandler'
import type { BotHandler } from './defineBotHandler'

export interface CommandHandlerPayload {
  message: Message
  command: string
  args: string
}

export interface BotCommandHandlerOptions {
  command: string | RegExp
  handler: (payload: CommandHandlerPayload) => unknown
  middleware?: BotHandler<'message'> | string | (string | BotHandler<'message'>)[]
}

/**
 * 定义被 @ 时的命令
 */
export function defineBotCommandHandler(options: BotCommandHandlerOptions) {
  const { command, handler, middleware } = options
  const regex
    = typeof command === 'string'
      ? new RegExp(`@.*?\\s(${command})(?:\\s([\\S\\s]*))?`)
      : command
  return defineBotMessageHandler({
    hook: 'message:room:mention',
    when: regex,
    handler(msg) {
      if (!msg)
        return
      const text = msg.text()
      const match = regex.exec(text)!
      const [, cmd, args] = match
      return handler({
        message: msg,
        command: cmd,
        args,
      })
    },
    middleware,
  })
}
