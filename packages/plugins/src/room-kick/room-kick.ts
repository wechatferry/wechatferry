import { matchers, talkers } from 'wechaty-plugin-contrib'
import { log, types } from 'wechaty'
import { defineWechatyPlugin } from '../utils'

export interface RoomKickOptions {
  /** 启用的群聊 */
  room: matchers.RoomMatcherOptions
  /** 管理员，管理员不能互相踢 */
  admin: matchers.ContactMatcherOptions
  /** 黑名单消息匹配器 */
  blackListMessage?: matchers.MessageMatcherOptions
}

export const wechatyPluginRoomKick = defineWechatyPlugin((config: RoomKickOptions) => {
  const isManagedRoom = matchers.roomMatcher(config.room)
  const isAdmin = matchers.contactMatcher(config.admin)
  const isBlackListMessage = matchers.messageMatcher(config.blackListMessage ?? false)

  const talkAdminKickWarn = talkers.roomTalker<any>('你违反了群规，管理员现将你移出群聊 ✈️')
  const talkKickWarn = talkers.roomTalker<any>('你发表了不当言论，现将你移出群聊✈️ \n欢迎再次进来。')

  return (bot) => {
    log.verbose('WechatyPlugin', 'wechatyPluginRoomKick(%s)', bot)
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
        if (text === 'KICK' || text === 'BAN') {
          await talkAdminKickWarn(room, mentionList)
          await bot.sleep(1000)
          for (const member of mentionList) {
            // 不可以踢出管理员
            if (!await isAdmin(member)) {
              await room.remove(member)
            }
          }
        }
      }
      else if (await isBlackListMessage(message)) {
        await talkKickWarn(room, [talker])
        await bot.sleep(1000)
        await room.remove(talker)
      }
    })
  }
})
