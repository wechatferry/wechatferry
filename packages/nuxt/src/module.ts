import { addServerScanDir, createResolver, defineNuxtModule } from '@nuxt/kit'
import { onDevToolsInitialized } from '@nuxt/devtools-kit'
import type { ScannedWcferrySkill } from '../types'
import { setupVirtual } from './virtual'
import { setupDevToolsUI } from './devtools'
import { setupRPC } from './server-rpc'

export interface ModuleOptions {
  /**
   * Enable debug mode
   * @default false
   */
  debug: boolean
  /**
   * 为 puppet 启用安全模式
   * @default false
   * @link https://wcferry.netlify.app/plugins/safe-mode.html
   */
  safeMode: boolean
  /**
   * 为 agent 启用 keepalive
   * @default false
   */
  keepalive: boolean | number
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'wcferry',
    configKey: 'wcferry',
  },
  defaults: {
    debug: false,
    safeMode: false,
    keepalive: false,
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

    if (options.debug || nuxt.options.dev) {
      addServerScanDir(resolver.resolve('./runtime/nitro'))
      setupDevToolsUI(options, resolver.resolve)
      onDevToolsInitialized(() => {
        setupRPC(nuxt, options)
      })
    }
  },
})

declare module 'nuxt/schema' {
  interface RuntimeConfig {
    wcferry: ModuleOptions
  }
}

declare module 'nitropack' {
  export interface Nitro {
    scannedSkills?: ScannedWcferrySkill[]
  }
}
