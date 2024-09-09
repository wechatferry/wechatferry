// @unocss-include
export interface Integration {
  icon: string
  name: string
  link: string
  target?: string
  secondary?: string
}

export const integrations: Integration[] = [
  { name: 'Node', link: '/integrations/node', icon: 'i-logos-nodejs' },
  { name: 'Wechaty', link: '/integrations/wechaty', icon: 'https://wechaty.js.org/img/wechaty-logo.svg' },
  { name: 'Nuxt', link: '/integrations/nuxt', icon: 'i-logos-nuxt-icon' },
]

export const plugins: Integration[] = [
  { name: '安全模式', link: '/plugins/safe-mode', icon: 'i-carbon:ai-governance-lifecycle' },
  { name: '群聊禁言', link: '/plugins/room-mute', icon: 'i-carbon:error' },
  { name: '群聊踢人', link: '/plugins/room-kick', icon: 'i-carbon:misuse-outline' },
]
