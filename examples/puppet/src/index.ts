import { WechatferryPuppet } from 'wechatferry/puppet'
import { WechatyBuilder } from 'wechaty'
import { useLogger } from 'wechatferry/logger'

const logger = useLogger('puppet-example')

const puppet = new WechatferryPuppet()
const bot = WechatyBuilder.build({ puppet })

bot.on('message', (msg) => {
  logger.info(JSON.stringify(msg, null, 2))
  msg.text() === 'ding' && msg.say('dong')
})
  .start()
  .then(() => logger.info('Bot started'))
  .catch(console.error)
