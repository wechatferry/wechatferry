import { WechatyBuilder } from 'wechaty'
import { beforeAll, expect, it } from 'vitest'
import { WechatferryPuppet } from '../packages/puppet/src'
import { WechatferryAgent } from '../packages/agent/src'

const agent = new WechatferryAgent()
const puppet = new WechatferryPuppet({
  agent,
})
const bot = WechatyBuilder.build({
  puppet,
})

beforeAll(() => {
  return new Promise((r) => {
    bot.start()
    bot.once('ready', r)
  })
})

const fakeMessage = {
  is_self: false,
  is_group: true,
  id: '5588315607154242157',
  type: 10000,
  ts: 1725260569,
  roomid: '53423823892@chatroom',
  content: '',
  sender: '53423823892@chatroom',
  sign: '623cbc75463d1f4daffa48297eea3157',
  thumb: '',
  extra: '',
  xml: '',
}

// "小茸茸"通过扫描你分享的二维码加入群聊
//
// "小茸茸"邀请"小茸茸"加入了群聊
// 你将"小茸茸"移出了群聊
// 你修改群名为"三花 AI 群"

it.skip('room-join', async () => {
  // @ts-expect-error ignore
  const { room, inviteeList, inviter } = await new Promise((r) => {
    bot.once('room-join', (room, inviteeList, inviter) => {
      r({ room, inviteeList, inviter })
    })
    agent.emit('message', {
      ...fakeMessage,
      content: '你邀请"小茸茸"加入了群聊',
    })
  })
  const user = inviteeList[0]
  expect(room.id).equal(fakeMessage.roomid)
  expect(user.name()).equal('小茸茸')
  expect(inviter.name()).equal('小茸茸')
})

it.skip('room-qr-join', async () => {
  // @ts-expect-error ignore
  const { room, inviteeList, inviter } = await new Promise((r) => {
    bot.once('room-join', (room, inviteeList, inviter) => {
      r({ room, inviteeList, inviter })
    })
    agent.emit('message', {
      ...fakeMessage,
      content: '"小茸茸"通过扫描"小茸茸"分享的二维码加入群聊',
    })
  })
  const user = inviteeList[0]
  expect(room.id).equal(fakeMessage.roomid)
  expect(user.name()).equal('小茸茸')
  expect(inviter.name()).equal('小茸茸')
})

it.skip('room-leave', async () => {
  // @ts-expect-error ignore
  const { room, leaverList, remover } = await new Promise((r) => {
    bot.once('room-leave', (room, leaverList, remover) => {
      r({ room, leaverList, remover })
    })
    agent.emit('message', {
      ...fakeMessage,
      content: '你将"小茸茸"移出了群聊',
    })
  })
  const user = leaverList[0]
  expect(room.id).equal(fakeMessage.roomid)
  expect(user.name()).equal('小茸茸')
  expect(remover.name()).equal('小茸茸')
})
