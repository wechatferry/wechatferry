// https://nuxt.com/docs/api/configuration/nuxt-config
import { createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

export default defineNuxtConfig({
  devtools: { enabled: true },
  compatibilityDate: '2024-08-22',
  alias: { '#sanhua-robot': resolve('./') },
  modules: ['@wechatferry/nuxt'],
})

declare module 'nuxt/schema' {
  interface RuntimeConfig {
    redis?: {
      host?: string
      port?: number
    }
    siliconflow?: {
      apiKey?: string
      baseURL?: string
    }
    deepseek?: {
      apiKey?: string
      baseURL?: string
    }
    openai?: {
      apiKey?: string
      baseURL?: string
    }
  }
}
