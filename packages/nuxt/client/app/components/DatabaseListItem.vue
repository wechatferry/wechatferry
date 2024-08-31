<script setup lang="ts">
import type { DatabaseListItem } from '~~/types/database'

withDefaults(defineProps<{
  item: DatabaseListItem
  parent?: DatabaseListItem
  index?: number
}>(), {
  index: 0,
})

const open = ref(false)
const currentDatabase = useCurrentDatabasePath()

function handleClick(item: DatabaseListItem) {
  open.value = !open.value
  currentDatabase.value = item.path
}
</script>

<template>
  <div>
    <button
      flex="~ gap-2"
      w-full
      items-start
      items-center
      px2
      py1
      class="hover-n-bg-active"
      :class="[{ 'n-bg-active': currentDatabase === item.path }]"
      :style="{ paddingLeft: `calc(0.5rem + ${index * 1.5}em)` }"
      @click="handleClick(item)"
    >
      <div
        :class="{ 'w-16': !item.items }"
        flex-none
        text-left
      >
        <NIcon
          v-if="item.items"
          icon="carbon:chevron-right"
          mb0.5
          :transform-rotate="open ? 90 : 0"
          transition
        />
        <NBadge
          v-else
        >
          {{ item.type || 'TEXT' }}
        </NBadge>
      </div>
      <span
        :class="{ 'flex items-center': item.items }"
        text-sm
        font-mono
      >
        <NIcon
          v-if="index === 0"
          :title="`${item.items?.length} routes`"
          icon="i-carbon:db2-database"
          mr1
        />
        <NIcon
          v-else-if="index === 1"
          :title="`${item.items?.length} routes`"
          icon="carbon:table"
          mr1
        />
        {{ item.name }}
      </span>
    </button>
    <div class="border-b w-full n-border-base" />
    <slot v-if="open">
      <DatabaseListItem
        v-for="subItem in item.items"
        :key="subItem.name"
        :item="subItem"
        :parent="item"
        :index="index + 1"
      />
    </slot>
  </div>
</template>
