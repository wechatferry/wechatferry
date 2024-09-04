import { appMsgParser } from './appMsgParser'
import { addMessageParser, executeMessageParsers } from './parser'
import { referMsgParser } from './referMsgParser'
import { roomParser } from './roomParser'
import { typeParser } from './typeParser'

addMessageParser(typeParser)
addMessageParser(appMsgParser)
addMessageParser(referMsgParser)
addMessageParser(roomParser)

export { executeMessageParsers }
