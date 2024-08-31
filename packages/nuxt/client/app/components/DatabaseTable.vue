<script setup lang="ts">
import 'ag-grid-community/styles/ag-grid.css' // Mandatory CSS required by the Data Grid
import 'ag-grid-community/styles/ag-theme-quartz.css' // Optional Theme applied to the Data Grid
import { AgGridVue } from 'ag-grid-vue3' // Vue Data Grid Component

const { results: rowData, status } = useSql()
const colDefs = computed(() => {
  const data = rowData.value?.[0] ?? {}

  return Object.keys(data).map(column => ({
    field: column,
  }))
})

const isDark = useDark()
</script>

<template>
  <AgGridVue
    class="h-full"
    style="--ag-wrapper-border-radius: 0px;--ag-header-background-color: transparent ;--ag-background-color: transparent ;"
    :loading="status === 'pending'"
    :row-data="rowData"
    :column-defs="[...colDefs]"
    :class="isDark ? 'ag-theme-quartz-dark' : 'ag-theme-quartz'"
    :grid-options="{
      enableCellTextSelection: true,
    }"
  />
</template>
