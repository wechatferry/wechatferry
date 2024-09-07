# 安全模式

微信有着相对严格的风控措施，使用该插件包裹的 puppet 将限制为：

- 给相同对象发消息的频率控制：控制发送消息的节奏为 3 秒。
- 给不同对象发消息的频率控制：每个对象之间的间隔为 3 ~ 5 秒。
- 全局限制：1 分钟内总共不能超过 40 条消息。

::: danger
请注意，安全模式不是魔法，他只限制发送消息的频率，你任然需要挂机养号等操作
:::

## 使用

::: code-group
```ts twoslash [index.ts]
import { createSafeModePuppet } from '@wechatferry/plugins'
import { WechatferryPuppet } from '@wechatferry/puppet'
const puppet = createSafeModePuppet(new WechatferryPuppet())
```
:::
