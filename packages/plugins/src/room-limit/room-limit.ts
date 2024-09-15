import { matchers, talkers } from 'wechaty-plugin-contrib'
import { log } from 'wechaty'
import type { Driver } from 'unstorage'
import { createStorage } from 'unstorage'
import { defineWechatyPlugin } from '../utils'

export interface RoomLimitOptions {
  /** 启用的群聊 */
  room: matchers.RoomMatcherOptions
  /** 白名单 */
  whitelist: matchers.ContactMatcherOptions
  /**
   * 间隔，单位 s
   * @default 10
   */
  interval?: number
  /**
   * 条数
   * @default 5
   */
  limit?: number
  /** 可选 */
  driver?: Driver
}

export const wechatyPluginRoomLimit = defineWechatyPlugin((config: RoomLimitOptions) => {
  const isManagedRoom = matchers.roomMatcher(config.room)
  const isWhitelist = matchers.contactMatcher(config.whitelist)
  const { interval = 10, limit = 5 } = config
  const store = createStorage<number>({
    driver: config.driver,
  })

  const talkLimitWarn = talkers.roomTalker<any>(`你的发言过于频繁。现将你移出群聊✈️\n欢迎冷静后再次进群。\n请大家理性交流，谢谢！`)

  return (bot) => {
    log.verbose('WechatyPlugin', 'wechatyPluginRoomLimit(%s)', bot)
    bot.on('message', async (message) => {
      if (message.self())
        return

      const room = message.room()
      if (!room)
        return
      if (!await isManagedRoom(room))
        return

      const talker = message.talker()
      if (await isWhitelist(talker))
        return

      // 在 interval 内，每个人都只能发 limit 条消息
      const key = `${room.id}:${talker.id}`
      const count = await store.getItem(key) || 0
      if (count >= limit) {
        await talkLimitWarn(room, [talker])
        return
      }
      await store.setItem(key, count + 1)
      setTimeout(async () => {
        const count = await store.getItem(key) || 0
        if (count > 0)
          await store.setItem(key, count - 1)
      }, interval)
    })
  }
})
