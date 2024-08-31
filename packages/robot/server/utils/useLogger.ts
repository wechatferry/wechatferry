import { createConsola } from 'consola'

const logger = createConsola().withTag('sanhua')

export function useLogger(tag?: string) {
  return tag ? logger.withTag(tag) : logger
}
