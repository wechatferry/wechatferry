# Wechaty

[Wechaty](https://wechaty.js.org) 应该是最著名的微信机器人框架之一，它提供了友好、通用的 API 并允许自定义 Puppet，尽管其已经不再积极维护，但仍然非常值得推荐使用。

@wechatferry/puppet 使用 @wechatferry/agent 并参考 [puppet-padlocal](https://github.com/wechaty/puppet-padlocal/) 实现了 wcf 的所有功能，更多请阅读[API文档](https://www.jsdocs.io/package/@wechatferry/puppet)

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

一个最简单的 DingDong 机器人，更多例子可以访问 [wechaty 示例代码](https://wechaty.gitbook.io/wechaty/v/zh/example)

::: code-group
```ts twoslash [index.ts]
import { WechatferryPuppet } from '@wechatferry/puppet'
import { WechatyBuilder } from 'wechaty'

const puppet = new WechatferryPuppet()
const bot = WechatyBuilder.build({ puppet })

bot.on('message', (msg) => {
  msg.text() === 'ding' && msg.say('dong')
})
  .start()
```
:::

## 例子

去 wechaty 上看去吧

## 缓存管理

https://github.com/wechatferry/wechatferry/issues/41

现在支持自定义缓存管理，wcf 使用的是 hook 方案。不一定需要缓存，所以你可以自己实现从 agent 中直接查询

::: code-group
```ts [index.ts]
import { CacheManager } from '@wechatferry/puppet'

class MyCacheManager implements CacheManager {
  // pass
}
```
:::