import type { ServerFunctions as SF } from '@nuxt/devtools-kit/types'

export interface ServerFunctions extends SF {
}

export interface ClientFunctions {
}

export interface ScannedWcferrySkill {
  name: string
  path: string
  fullPath: string
}
declare module '@nuxt/devtools-kit/types' {
  export interface ServerFunctions {
    getServerSkills: () => ScannedWcferrySkill[]
  }
}
