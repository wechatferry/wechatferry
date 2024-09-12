import { WechatferryAgent } from 'wechatferry/agent'
import { useLogger } from 'wechatferry/logger'

const logger = useLogger('agent-example')
const agent = new WechatferryAgent()

agent.on('error', () => {})
agent.on('message', (msg) => {
  logger.info(JSON.stringify(msg, null, 2))
})

agent.start()
