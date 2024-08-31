import { createEventStream, defineEventHandler } from 'h3'
import { colors } from 'consola/utils'
import { useBot } from '../../../server/utils/useBot'

export default defineEventHandler(async (event) => {
  const eventStream = createEventStream(event)
  const bot = useBot()

  function push(event: string, data?: unknown) {
    const message = typeof data === 'string' ? data : JSON.stringify(data)
    eventStream.push(`${colors.gray(`${new Date().toISOString()}➜ `)} ${colors.gray('[')}${event}${colors.gray(']')} ${data ? message : ''}`)
  }

  bot.on('start', () => push(colors.white('start')))
  bot.on('login', user => push(colors.green('login'), user))
  bot.on('ready', () => push(colors.green('ready')))
  bot.on('error', error => push(colors.red('error'), error.message))
  bot.on('message', msg => push(colors.yellow('message'), msg.payload))
  bot.on('logout', user => push(colors.red('logout'), user))
  bot.on('stop', () => push(colors.red('stop')))

  eventStream.onClosed(async () => {
    await eventStream.close()
  })

  push(colors.green('heartbeat'))
  const timer = setInterval(() => {
    if (eventStream) {
      push(colors.green('heartbeat'))
    }
    else {
      clearInterval(timer)
    }
  }, 30000)

  return eventStream.send()
})
