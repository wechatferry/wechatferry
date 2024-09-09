# 群聊踢人

尽管微信支持了踢人，但好麻烦，这个插件支持了命令式和关键字匹配踢人

## 使用

::: code-group
```ts twoslash [bot.ts]
import { WechatyBuilder } from 'wechaty'
import { wechatyPluginRoomKick } from '@wechatferry/plugins'

const bot = WechatyBuilder.build()
bot
  .use(wechatyPluginRoomKick({
    admin: [],
    room: [],
    // blackListMessage: [/fuck/i]
  }))
bot.start()
```
:::

使用效果如下：

```
RoomName

Admin: BAN @User
Bot: @User 你违反了群规，管理员现将你移出群聊
System: 你将"User"移出了群聊
```

除了 `BAN` 踢人外，设置的管理员还可以使用 `KICK` 来踢人
