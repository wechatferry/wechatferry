<script setup lang="ts">
const { table } = useDatabase()
const { execute, sql } = useSql()
watch(() => table.value?.name, async (table) => {
  if (!table)
    return
  sql.value = `SELECT * FROM \`${table}\` LIMIT 10;`
  nextTick(() => {
    execute()
  })
})
</script>

<template>
  <NSplitPane
    horizontal
    storage-key="wcferry-database-details"
  >
    <template #left>
      <DatabaseEditor />
    </template>
    <template #right>
      <DatabaseTable />
    </template>
  </NSplitPane>
</template>
