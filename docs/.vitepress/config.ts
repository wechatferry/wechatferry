import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'WechatFerry',
  description: '基于 WechatFerry 的微信机器人底层框架',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
    ],

    sidebar: [
      {
        text: '指南',
        items: [
          { text: '快速开始', link: '/guide' },
        ],
      },
      {
        text: '集成',
        items: [
          { text: 'Node', link: '/integrations/node' },
          { text: 'Wechaty', link: '/integrations/wechaty' },
          { text: 'Nuxt', link: '/integrations/nuxt' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/wechatferry/wechatferry' },
    ],
  },
})
