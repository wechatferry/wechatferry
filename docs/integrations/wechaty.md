# Wechaty

wcferry puppet for wechaty

## 安装

::: code-group
  ```bash [pnpm]
  pnpm add wechaty @wechatferry/puppet
  ```
  ```bash [yarn]
  yarn add wechaty @wechatferry/puppet
  ```
  ```bash [npm]
  npm install wechaty @wechatferry/puppet
  ```
:::

## 使用

```ts
// main.ts
import { WechatFerryPuppet } from '@wechatferry/puppet'
import { WechatyBuilder } from 'wechaty'

const puppet = new WechatFerryPuppet()
const bot = WechatyBuilder.build({ puppet })

bot.on('message', msg => console.log(msg))
bot.start()
```
