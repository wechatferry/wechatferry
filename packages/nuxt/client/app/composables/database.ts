import type { DatabaseListItem } from '~~/types/database'

export function useCurrentDatabasePath() {
  return useSessionStorage<string>('wcferry:database:currentDatabasePath', '')
}

export function useSqlCode() {
  return useLocalStorage('wcferry:database:sqlCode', '')
}

function _useDatabase() {
  const { data: list, execute } = useFetch<DatabaseListItem[]>('../../__wcferry__/database', { key: 'database', immediate: false })
  const currentPath = useCurrentDatabasePath()
  const current = computed(() => {
    const dbName = currentPath.value.split('/')[0]
    return unref(list)?.find((db: { name: string }) => db.name === dbName)
  })
  const tableName = computed(() => currentPath.value.split('/')[1])
  const table = computed(() => {
    return current.value?.items?.find(v => v.name === unref(tableName))
  })
  return {
    list,
    execute,
    currentPath,
    current,
    table,
  }
}

export const useDatabase = createSharedComposable(_useDatabase)

function _useSql() {
  const currentPath = useCurrentDatabasePath()
  const db = computed(() => currentPath?.value.split('/')[0])
  const code = useSqlCode()
  const sql = ref('')
  const { data: results, execute, status } = useFetch<Record<string, unknown>[]>('../../__wcferry__/database', {
    immediate: false,
    method: 'POST',
    body: computed(() => ({
      db: db.value,
      sql: sql.value,
    })),
    watch: false,
    default: () => [],
  })

  return {
    sql,
    code,
    results,
    execute,
    status,
  }
}

export const useSql = createSharedComposable(_useSql)
