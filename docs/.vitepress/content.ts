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
