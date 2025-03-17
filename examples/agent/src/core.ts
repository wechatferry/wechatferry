import { Wechatferry } from 'wechatferry'
import { useLogger } from 'wechatferry/logger'

const logger = useLogger('core-example')
const core = new Wechatferry()

core.on('sended', (event) => {
    logger.info(`Message sent: ${event}`)
})
core.on('message', (msg) => {
    logger.info(`${msg.sender}: ${msg.content}`)

    if (msg.content === 'ping') {
        core.sendTxt("pong", 'filehelper')
    }
})


core.start()