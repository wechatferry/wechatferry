export default defineNuxtConfig({
  modules: ['../src/module'],
  wcferry: {
    keepalive: true,
  },
  devtools: { enabled: true },
  compatibilityDate: '2024-08-25',
})
