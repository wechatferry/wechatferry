import { addServerScanDir, createResolver, defineNuxtModule } from '@nuxt/kit'
import fb from 'fast-glob'
import { basename, extname, join, relative, resolve } from 'pathe'
import { camelCase } from 'scule'
import { onDevToolsInitialized } from '@nuxt/devtools-kit'
import type { Nitro } from 'nitropack'
import type { ScannedWcferrySkill } from '../types'
import { setupVirtual } from './virtual'

export interface ModuleOptions {
  debug: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'wcferry',
    configKey: 'wcferry',
  },
  defaults: {
    debug: false,
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    addServerScanDir(resolver.resolve('./runtime/server'))
    nuxt.options.runtimeConfig.wcferry = options
    nuxt.options.nitro ??= {}
    nuxt.options.nitro.experimental ??= {}
    nuxt.options.nitro.experimental.tasks = true
    nuxt.hook('nitro:init', (_) => {
      setupVirtual(nuxt, _)
    })
  },
})

declare module 'nuxt/schema' {
  interface RuntimeConfig {
    wcferry: object
  }
}

declare module 'nitropack' {
  export interface Nitro {
    scannedSkills?: ScannedWcferrySkill[]
  }
}
