import type { Nitro } from 'nitropack'
import { debounce } from 'perfect-debounce'
import type { NuxtDevtoolsServerContext, ServerFunctions } from '@nuxt/devtools-kit/types'
import type { ScannedWcferrySkill } from '~/types'

export function setupServerSkillsRPC({ nuxt, refresh }: NuxtDevtoolsServerContext) {
  let nitro: Nitro

  let cache: ScannedWcferrySkill[] | null = []

  const refreshDebounced = debounce(() => {
    cache = null
    refresh('getServerSkills')
  }, 500)

  nuxt.hook('nitro:init', (_) => {
    nitro = _
    cache = null
    refresh('getServerSkills')
  })

  nuxt.hook('ready', () => {
    nitro.hooks.hook('rollup:reload', refreshDebounced)
  })

  function scan() {
    if (cache)
      return cache

    cache = (() => {
      if (!nitro) {
        return []
      }
      return [
        ...(nitro.scannedSkills ?? []),
      ]
    })()

    return cache
  }

  return {
    getServerSkills() {
      return scan()
    },
  } satisfies Partial<ServerFunctions>
}
