// https://vitepress.dev/guide/custom-theme
import { h, watch } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import 'uno.css'
import 'virtual:group-icons.css'

export default {
  extends: DefaultTheme,
} satisfies Theme

if (typeof window !== 'undefined') {
  // detect browser, add to class for conditional styling
  const browser = navigator.userAgent.toLowerCase()
  if (browser.includes('chrome'))
    document.documentElement.classList.add('browser-chrome')
  else if (browser.includes('firefox'))
    document.documentElement.classList.add('browser-firefox')
  else if (browser.includes('safari'))
    document.documentElement.classList.add('browser-safari')
}
