# Node.js

适用于任何 Node.js 环境

## 安装

::: code-group
  ```bash [pnpm]
  pnpm add -D wechatferry
  ```
  ```bash [yarn]
  yarn add -D wechatferry
  ```
  ```bash [npm]
  npm install -D wechatferry
  ```
:::

## 使用

```ts
// main.ts
import { WechatFerry } from 'wechatferry'

const wcf = new WechatFerry()
wcf.on('message', (msg) => {
  console.log(msg)
})

wcf.start()
```
