# 群聊禁言

微信不支持禁言群友，那么我们可以自己维护一个状态，如果在禁言期间内发言就将其移出群聊

## 使用

::: code-group
```ts twoslash [bot.ts]
import { WechatferryPuppet } from '@wechatferry/puppet'
import { WechatferryPuppet } from '@wechatferry/plugins'

const bot = WechatyBuilder.build()
bot
  .use(wechatyPluginRoomMute({
    admin: [],
    room: [],
  }))
  .start()
```
:::

使用效果如下：

```
RoomName

Admin: MUTE @User
Bot: @User 已被禁言 5 分钟，将于 12:35:25 后解封，期间发言将被移出群聊。
User: 🤡
Bot: @User 你在被禁言期间发言。现将你移出群聊✈️\n欢迎冷静后再次进群。\n请大家理性交流，谢谢！
```

除了 `MUTE` 禁言外，设置的管理员还可以使用 `UNMUTE` 来接触禁言
