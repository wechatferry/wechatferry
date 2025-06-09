# Nuxt

使用 Nuxt 享受绝佳的开发体验

## 功能特性

- 简单易用的 WeChat 机器人 API
- 自动管理 WeChat 连接和生命周期
- 提供多种实用工具函数和钩子
- 集成 Nuxt DevTools 支持
- 支持自定义技能（Skills）扩展

## 安装

```bash
pnpx nuxi module add @wechatferry/nuxt
```

## 使用

```ts
// server/wcferry/skills/*.ts
/**
 * 在群里说：@机器人 ping
 * 机器人回复：pong
 */
export default defineBotCommandHandler({
  command: 'ping',
  handler({ message, _command, _args }) {
    message.say('pong')
  },
})
```

`server/wcferry/skills` 文件夹下的技能和机器人命令将自动导入！


## 配置

将模块添加到 `nuxt.config.ts` 文件中：

```ts
export default defineNuxtConfig({
  modules: [
    '@wechatferry/nuxt'
  ],
  wcferry: {
    // 模块配置选项
    debug: false,       // 启用调试模式
    safeMode: false,    // 为 puppet 启用安全模式
    keepalive: false,   // 为 agent 启用 keepalive
  }
})
```

## 使用方法

### 基础用法

在 Nuxt 服务端使用 WeChatFerry 机器人：

```ts
// server/api/bot.ts
import { useBot } from '#imports'

export default defineEventHandler(async (event) => {
  const bot = useBot()
  
  // 启动机器人
  await bot.start()
  
  return { status: 'Bot started' }
})
```

### 消息处理

定义消息处理器来响应微信消息：

```ts
// server/bot/message.ts
import { defineBotMessageHandler } from '#imports'

export default defineBotMessageHandler(async (message) => {
  // 检查消息是否来自联系人（非群聊）
  if (message.room()) {
    return
  }
  
  const text = message.text()
  const contact = message.talker()
  
  // 回复消息
  if (text === 'ping') {
    await contact.say('pong')
  }
})
```

### 群聊消息处理

处理来自群聊的消息：

```ts
// server/bot/room-message.ts
import { defineBotMessageHandler } from '#imports'

export default defineBotMessageHandler({
  hook: 'message:room', // 指定处理群聊消息
  async handler(message) {
    const room = message.room()
    const text = message.text()
    
    if (text === '群聊命令') {
      await room.say('已收到群聊命令')
    }
  }
})
```

### 命令处理

定义命令处理器，用于响应特定命令：

```ts
// server/bot/commands.ts
import { defineBotCommandHandler } from '#imports'

export default defineBotCommandHandler({
  name: 'help',  // 命令名称
  description: '显示帮助信息', // 命令描述
  async handler(message) {
    const contact = message.talker()
    await contact.say('可用命令：\n- help: 显示帮助信息\n- ping: 测试机器人是否在线')
  }
})
```

### 定时任务

创建定时执行的任务：

```ts
// server/bot/cron.ts
import { defineCronTask } from '#imports'

export default defineCronTask({
  cron: '0 9 * * *', // 每天早上 9 点执行
  async handler() {
    const bot = useBot()
    const contact = await bot.Contact.find({ name: '张三' })
    if (contact) {
      await contact.say('早上好！这是每日提醒。')
    }
  }
})
```

### 中间件

定义机器人中间件来预处理消息：

```ts
// server/bot/middleware.ts
import { defineBotMiddleware } from '#imports'

export default defineBotMiddleware({
  hook: 'message', // 适用于所有消息
  async handler(message) {
    // 记录所有消息
    console.log(`收到消息：${message.text()}`)
    
    // 返回 undefined 以继续处理链
    // 返回任何其他值将中断处理链
  }
})
```

### 房间事件处理

处理群聊相关事件：

```ts
// server/bot/room-events.ts
import { defineBotRoomHandler } from '#imports'

export default defineBotRoomHandler({
  hook: 'room:join', // 处理加入群聊事件
  async handler(room, inviteeList, inviter) {
    // 有人加入群聊时的处理逻辑
    const names = inviteeList.map(c => c.name()).join(', ')
    await room.say(`欢迎 ${names} 加入群聊！`)
  }
})
```

## 可用的工具函数

### useBot()

获取 Wechaty 机器人实例。

```ts
import { useBot } from '#imports'

const bot = useBot()
// 使用 bot 实例进行操作
```

### useBotPuppet()

获取 WeChatFerry puppet 实例。

```ts
import { useBotPuppet } from '#imports'

const puppet = useBotPuppet()
// 使用 puppet 实例进行底层操作
```

### useBotAgent()

获取 WeChatFerry agent 实例。

```ts
import { useBotAgent } from '#imports'

const agent = useBotAgent()
// 使用 agent 实例
```

## 处理器类型

| 处理器 | 描述 |
|--------|------|
| `defineBotHandler` | 通用处理器，可处理任何类型的事件 |
| `defineBotMessageHandler` | 专门用于处理消息事件 |
| `defineBotRoomHandler` | 专门用于处理群聊相关事件 |
| `defineBotCommandHandler` | 用于定义和处理命令 |
| `defineBotMiddleware` | 定义中间件，用于预处理事件 |
| `defineCronTask` | 定义定时任务 |

## 开发

```bash
# 安装依赖
npm install

# 生成类型
npm run dev:prepare

# 开发模式
npm run dev

# 构建模块
npm run build

# 运行测试
npm run test
```
