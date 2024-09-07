import { appMsgParser } from './appmsg-parser'
import { addMessageParser, executeMessageParsers } from './parser'
import { referMsgParser } from './refermsg-parser'
import { roomParser } from './room-parser'
import { typeParser } from './type-parser'

addMessageParser(typeParser)
addMessageParser(appMsgParser)
addMessageParser(referMsgParser)
addMessageParser(roomParser)

export { executeMessageParsers }
