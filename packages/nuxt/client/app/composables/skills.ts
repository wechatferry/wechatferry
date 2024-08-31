import { useDevtoolsClient } from '@nuxt/devtools-kit/iframe-client'
import type { ServerFunctions, ClientFunctions } from '../../../types'
import type { AsyncDataOptions } from '#app'

export function useRpc() {
  const client = useDevtoolsClient()
  return client.value!.devtools.extendClientRpc<ServerFunctions, ClientFunctions >('wcferry', {})
}

export function useServerSkills() {
  return useAsyncState('getServerSkills', () => {
    const rpc = useRpc()
    return rpc!.getServerSkills()
  })
}

export function useAsyncState<T>(key: string, fn: () => Promise<T>, options?: AsyncDataOptions<T>) {
  const nuxt = useNuxtApp()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unique = nuxt.payload.unique = nuxt.payload.unique || {} as any
  if (!unique[key])
    unique[key] = useAsyncData(key, fn, options)

  return unique[key].data as Ref<T | null>
}
