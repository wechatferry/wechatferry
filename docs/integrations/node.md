# Node.js

适用于任何 Node.js 环境，内置强大且易用的Agent库，涵盖了绝大多数常用微信操作，更多说明请阅读[API 参考](https://www.jsdocs.io/package/@wechatferry/agent)

## 安装

::: code-group
  ```bash [pnpm]
  pnpm add -D @wechatferry/agent
  ```
  ```bash [yarn]
  yarn add -D @wechatferry/agent
  ```
  ```bash [npm]
  npm install -D @wechatferry/agent
  ```
:::

## 使用

::: code-group
```ts twoslash [index.ts]
import { WechatferryAgent } from '@wechatferry/agent'

// 创建 agent 实例
const agent = new WechatferryAgent()

// 监听微信消息
agent.on('message', (msg) => {
  console.log(msg)
})

// 启动 wcf
agent.start()
```
:::

## Core 和 SDK

Core 内置 Socket 连接，并与 SDK 直接交互，如果你想要自己写常用操作，那么你也可以直接使用 core，其用法与 agent 几乎无异，更多请参考 [API 文档](https://www.jsdocs.io/package/@wechatferry/core)

::: code-group
  ```bash [pnpm]
  pnpm add -D @wechatferry/core
  ```
  ```bash [yarn]
  yarn add -D @wechatferry/core
  ```
  ```bash [npm]
  npm install -D @wechatferry/core
  ```
:::

::: code-group
```ts twoslash [index.ts]
import { Wechatferry } from '@wechatferry/core'

// 创建 wcf 实例
const wcf = new Wechatferry()

// 监听微信消息
wcf.on('message', (msg) => {
  console.log(msg)
})

// 启动 wcf
wcf.start()
```
:::

此外，core 包还直接导出了 SDK，若你想与 dll 直接交互，你也可以直接使用：

::: code-group
```ts twoslash [index.ts]
import { WechatferrySDK } from '@wechatferry/core'

// 创建 sdk 实例
const sdk = new WechatferrySDK()

// 监听微信消息
sdk.on('message', (msg) => {
  console.log(msg)
})

// 启动 wcf
sdk.init()
// 打开 `prot+1` 端口并接受消息
sdk.startRecvMessage()
```
:::

::: tip
始终推荐你使用 agent，而不是 core，除非你知道你在干什么。
:::
