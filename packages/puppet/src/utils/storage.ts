import { type Storage, type StorageValue, prefixStorage } from 'unstorage'

export type PrefixStorage<T extends StorageValue> = ReturnType<typeof createPrefixStorage<T>>

export function createPrefixStorage<T extends StorageValue>(storage: Storage<T>, base: string) {
  const s = prefixStorage(storage, base)

  const getItemsMap = async (base?: string) => {
    const keys = await s.getKeys(base)
    return await Promise.all(keys.map(async key => ({ key, value: await s.getItem(key) as T })))
  }
  return {
    ...s,
    getItemsMap,
    async getItemsList(base?: string) {
      return (await getItemsMap(base)).map(v => v.value)
    },
  }
}
