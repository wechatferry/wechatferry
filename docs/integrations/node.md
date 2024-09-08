# Node.js

适用于任何 Node.js 环境，内置强大且易用的 Agent 库，涵盖了绝大多数常用微信操作。

::: tip
始终推荐你使用 Wechaty，而不是直接使用 Agent，Wechaty 能极大的减少你的心智负担。
:::

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

更多说明请阅读[API 参考](https://www.jsdocs.io/package/@wechatferry/agent)

## Core 和 SDK

Core 内置了 Socket 连接，并通过 SDK 直接与 dll 交互，同时还支持自定义 SDK。

::: tip
如果你不用 Wechaty，我也始终推荐你使用 agent，而不是 core，除非你知道你在干什么。
:::

### Core

如果你想要自己写常用操作，那么你也可以直接使用 core，其用法与 agent 几乎无异，更多请参考 [API 文档](https://www.jsdocs.io/package/@wechatferry/core)

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

更多说明请阅读[API 参考](https://www.jsdocs.io/package/@wechatferry/core)

### SDK

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

当然，无需使用内置的 SDK，你可以自定义 SDK 直接连接现有的 wcf TCP 服务也是没问题的：

::: code-group
```ts twoslash [mysdk.ts]
import EventEmitter from 'node:events'
import type { Buffer } from 'node:buffer'
import type { WechatferrySDKEventMap, WechatferrySDKImpl } from '@wechatferry/core'
import { wcf } from '@wechatferry/core'
import { Socket } from '@rustup/nng'
import type { MessageRecvDisposable } from '@rustup/nng'

export class MySDK extends EventEmitter<WechatferrySDKEventMap> implements WechatferrySDKImpl {
  private messageRecvDisposable?: MessageRecvDisposable

  init(debug?: boolean, port?: number) {
    // init your sdk
    return true
  }

  destroy() {
    // stop your sdk
    this.stopRecvMessage()
  }

  startRecvMessage() {
    this.messageRecvDisposable = Socket.recvMessage(this.msgUrl, undefined, (err: unknown | undefined, buf: Buffer) => {
      if (err) {
        throw err
      }
      const rsp = wcf.Response.deserialize(buf)
      this.emit('message', rsp.wxmsg)
    })
  }

  stopRecvMessage() {
    this.messageRecvDisposable?.dispose()
    this.messageRecvDisposable = undefined
  }

  get isReceiving() {
    return !!this.messageRecvDisposable
  }

  get cmdUrl() {
    return 'tpc://...'
  }

  get msgUrl() {
    return 'tpc://...'
  }
}
const sdk = new MySDK()
```
:::

更多说明请阅读[API 参考](https://www.jsdocs.io/package/@wechatferry/core)
