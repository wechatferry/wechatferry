---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "wcf.js"
  text: "微信机器人框架"
  tagline: 可定制 · 强大 · 快速 · 开源
  image: https://api.iconify.design/unjs:automd.svg
  actions:
    - theme: brand
      text: 快速开始
      link: /guide
    - theme: alt
      text: GitHub
      link: https://github.com/wechatferry/wechatferry

features:
  - title: 全面集成 WechatFerry
    details: 完整实现的 WCF SDK 客户端，确保高效稳定的微信操作。无论是消息监听、消息发送还是群聊操作，这个框架都为你提供了一站式的解决方案。
    link: https://wcferry.netlify.app/integrations/node.html#core-%E5%92%8C-sdk
    icon: <span class="i-carbon:sdk"></span>
    linkText: '@wechatferry/core'
  - title: 强大的 Agent 库支持
    details: 内置强大且易用的 Agent 库，涵盖了绝大多数常用微信操作。无论是历史消息、数据库操作还是复杂的业务逻辑处理，这个库都能帮助你轻松实现。
    link: https://wcferry.netlify.app/integrations/node.html
    icon: <span class="i-carbon:ibm-toolchain"></span>
    linkText: '@wechatferry/agent'
  - title: Wechaty 免费协议
    details: 又一个 Wechaty 的免费协议，让你享受 Wechaty 强大生态系统带来的便利，快速扩展你的微信机器人的功能。
    link: https://wcferry.netlify.app/integrations/wechaty.html
    icon: <span class="i-carbon:load-balancer-pool"></span>
    linkText: '@wechatferry/puppet'
  - title: Nuxt 开发工具包
    details: 你可以在 Nuxt 框架中轻松接入微信机器人功能。内置开发者工具，包括数据库管理、机器人技能列表以及日志记录，帮助你快速构建和调试应用。
    link: https://wcferry.netlify.app/integrations/nuxt.html
    icon: <span class="i-carbon:debug"></span>
    linkText: '@wechatferry/nuxt'
  - title: Nuxt Layer
    details: 通过强大的 Nuxt 集成了 AI、Redis、任务队列、日志等常用工具。这让你的微信机器人不仅具备强大的处理能力，还能高效管理数据与任务，确保系统稳定可靠。
    link: https://www.npmjs.com/package/@wechatferry/robot
    icon: <span class="i-logos:nuxt-icon"></span>
    linkText: '@wechatferry/robot'
---
