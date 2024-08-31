# Nuxt

使用 Nuxt 享受绝佳的开发体验

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
