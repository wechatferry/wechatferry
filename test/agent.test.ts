import { beforeAll, expect, it } from 'vitest'
import { FileBox } from 'file-box'
import { WechatferryAgent } from '../packages/agent/src'

// const core = new Proxy(new Wechatferry(), {
//   get(target, prop, receiver) {
//     if (typeof prop === 'string') {
//       if (prop !== 'send' && prop.startsWith('send')) {
//         return (...args: any[]) => {
//           console.error(JSON.stringify(args))
//         }
//       }

//       if (prop === 'getSelfWxid') {
//         return () => 'filehelper'
//       }
//     }
//     return Reflect.get(target, prop, receiver)
//   },
// })

const wcf = new WechatferryAgent({
  // wcf: core,
})

beforeAll(() => {
  wcf.start()
})

it.skip('contacts', () => {
  const contactList = wcf.getContactList()
  expect(contactList[0]).toBeTypeOf('object')
})

it.skip('rooms', () => {
  const rooms = wcf.getChatRoomList()
  const room = rooms[0]
  expect(room).toBeTypeOf('object')
  expect(room.memberIdList?.[0]).toBeTypeOf('string')
})

it.skip('history', () => {
  const id = wcf.wcf.getSelfWxid()
  const messages = wcf.getHistoryMessageList(id, (sql) => {
    sql.limit(10)
  })
  const talkerWxid = messages[0].talkerWxid

  expect(talkerWxid).toBeTypeOf('string')
  expect(talkerWxid).toBe(id)
})

it.skip('say', () => {
  const id = wcf.wcf.getSelfWxid()
  wcf.sendText(id, 'hello')
})

it.skip('image', () => {
  const id = wcf.wcf.getSelfWxid()
  wcf.sendImage(id, FileBox.fromBase64('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdj2D751n8AB00DJKfruzgAAAAASUVORK5CYII=', 'test.png'))
})

it('bytesExtra', () => {
  const msg = wcf.getLastSelfMessage()
  console.error(msg)
})

// afterAll(() => {
//   wcf.stop()
// })
