import {
  log,
  types,
} from 'wechaty'

import { matchers, talkers } from 'wechaty-plugin-contrib'
import type { Driver } from 'unstorage'
import { createStorage } from 'unstorage'
import dayjs from 'dayjs'
import { defineWechatyPlugin } from '../utils'

const BLOCK_COMMAND_REGEX = /(MUTE|UNMUTE)\s?(\d+)?/g
export interface RoomMuteOptions {
  room: matchers.RoomMatcherOptions
  admin: matchers.ContactMatcherOptions
  driver?: Driver
}

export const wechatyPluginRoomMute = defineWechatyPlugin((config: RoomMuteOptions) => {
  const store = createStorage<{ unmuteTime: number }>({
    driver: config.driver,
  })
  const isManagedRoom = matchers.roomMatcher(config.room)
  const isAdmin = matchers.contactMatcher(config.admin)
  const talkMuteWarn = talkers.roomTalker<any>(`已被禁言 {{ muteDuration }} 分钟，将于 {{ unmuteTime }} 后解封，期间发言将被移出群聊。`)
  const talkUnmuteWarn = talkers.roomTalker<any>('已被解封，请理性发言，谢谢！')
  const talkKick = talkers.roomTalker('你在被禁言期间发言。现将你移出群聊✈️\n欢迎冷静后再次进群。\n请大家理性交流，谢谢！')

  return (bot) => {
    log.verbose('WechatyPlugin', 'wechatyPluginRoomMute(%s)', bot)
    bot.on('message', async (message) => {
      if (message.self())
        return
      const room = message.room()
      if (!room)
        return
      if (!await isManagedRoom(room))
        return

      const talker = message.talker()
      if (await isAdmin(talker)) {
        if (message.type() !== types.Message.Text)
          return
        const mentionList = await message.mentionList()
        if (mentionList.length <= 0)
          return
        const text = await message.mentionText()
        const match = BLOCK_COMMAND_REGEX.exec(text)
        if (!match)
          return
        // 默认封 5 分钟
        const [_, command, muteDuration = '5'] = match
        const unmuteTime = Date.now() + Number(muteDuration) * 60 * 1000
        const view = {
          muteDuration,
          unmuteTime: dayjs(unmuteTime).format('HH:mm:ss'),
        }
        if (command === 'UNMUTE') {
          await store.removeItem(mentionList[0].id)
          await talkUnmuteWarn(room, mentionList, view)
        }
        else if (command === 'MUTE') {
          for (const member of mentionList) {
            await store.setItem(member.id, {
              unmuteTime,
            })
          }
          await talkMuteWarn(room, mentionList, view)
        }
      }
      else if (await store.hasItem(talker.id)) {
        const { unmuteTime } = (await store.getItem(talker.id))!
        // 如果在解封前发言，则移出群聊
        if (unmuteTime > Date.now()) {
          await talkKick(room, talker)
          await bot.sleep(1000)
          await room.remove(talker)
        }
        else {
          // 解封后发言，删除记录
          await store.removeItem(talker.id)
        }
      }
    })
  }
})
