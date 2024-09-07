import { defineConfig } from 'vitepress'
import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
import { groupIconMdPlugin } from 'vitepress-plugin-group-icons'
// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'WechatFerry',
  description: '基于 WechatFerry 的微信机器人底层框架',

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: 'https://api.iconify.design/unjs:automd.svg',
    nav: [
      { text: '主页', link: '/' },
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
      {
        text: '插件',
        link: '/plugins',
        items: [
          { text: '安全模式', link: '/plugins/safe-mode' },
        ],
      },
      {
        text: 'API',
        items: [
          { text: '@wechatferry/core', link: 'https://www.jsdocs.io/package/@wechatferry/core' },
          { text: '@wechatferry/agent', link: 'https://www.jsdocs.io/package/@wechatferry/agent' },
          { text: '@wechatferry/puppet', link: 'https://www.jsdocs.io/package/@wechatferry/puppet' },
          { text: '@wechatferry/nuxt', link: 'https://www.jsdocs.io/package/@wechatferry/nuxt' },
          { text: '@wechatferry/robot', link: 'https://www.jsdocs.io/package/@wechatferry/robot' },
          { text: '@wechatferry/plugins', link: 'https://www.jsdocs.io/package/@wechatferry/plugins' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/wechatferry/wechatferry' },
    ],
  },
  markdown: {
    theme: {
      light: 'vitesse-light',
      dark: 'vitesse-dark',
    },
    codeTransformers: [
      transformerTwoslash() as any,
    ],
    config(md) {
      md.use(groupIconMdPlugin)
    },
  },
})
