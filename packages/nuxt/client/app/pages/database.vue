<script setup lang="ts">
definePageMeta({
  keepalive: true,
})

const { execute, current, list } = useDatabase()
await execute()
</script>

<template>
  <NSplitPane storage-key="wcferry-database">
    <template #left>
      <DatabaseListItem
        v-for="item in list"
        :key="item.name"
        :index="0"
        :item="item"
      />
    </template>
    <template #right>
      <DatabaseDetails
        v-if="current"
      />
      <NPanelGrids v-else>
        <NCard
          px6
          py2
        >
          <span op75>Select a database to start</span>
        </NCard>
      </NPanelGrids>
    </template>
  </NSplitPane>
</template>

<style>
.splitpanes__splitter {
  border-color: rgb(156 163 175 / 0.2)
}
</style>
