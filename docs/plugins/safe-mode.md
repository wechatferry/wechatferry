# 安全模式

微信有着相对严格的风控措施，使用该插件包裹的 puppet 将限制为：

- 给相同对象发消息的频率控制：控制发送消息的节奏，默认为 1 秒/条
- 给不同对象发消息的频率控制：每个对象之间的间隔，默认为 3 ~ 5 秒/条。
- 全局限制发消息的频率控制：控制全局发送消息的节奏，默认为 40 条/分钟

::: danger
请注意，安全模式不是魔法，他只限制发送消息的频率，你仍然需要挂机养号等操作
:::

## 使用

::: code-group
```ts twoslash [index.ts]
import { createSafeModePuppet } from '@wechatferry/plugins'
import { WechatferryPuppet } from '@wechatferry/puppet'
const puppet = createSafeModePuppet(new WechatferryPuppet())
```
:::
