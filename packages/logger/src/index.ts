import type { ConsolaInstance } from 'consola'
import { createConsola } from 'consola'

let logger: ConsolaInstance

export function useLogger(tag?: string) {
  if (!logger) {
    logger = createConsola()
    logger = logger.withTag('wechatferry')
  }
  return tag ? logger.withTag(tag) : logger
}
