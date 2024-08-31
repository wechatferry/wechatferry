<script lang="ts" setup>
const route = useRoute()
const terminals = [
  {
    name: 'Wcferry',
    icon: 'i-carbon-ibm-dynamic-route-server',
    to: '/',
  },
  {
    name: '事件',
    icon: 'i-carbon:webhook',
    to: '/event',
  },
  {
    name: '数据库',
    icon: 'i-carbon:data-base',
    to: '/database',
  },
]
</script>

<template>
  <div
    flex="~"
    border="b"
    flex-1
    items-center
    n-navbar-glass
    class="n-border-base p-1"
  >
    <NuxtLink
      v-for="t of terminals"
      :key="t.name"
      :to="t.to"
      border="r base"
      flex="~ gap-2"
      items-center
      px3
      py2
      class="n-border-base"
      :class="t.to === route.path ? 'bg-active' : ''"
    >
      <NIcon
        v-if="t.icon"
        class="text-base"
        :icon="t.icon"
      />
      <span :class="t.to === route.path ? 'text-primary' : 'op50'">
        {{ t.name }}
      </span>
    </NuxtLink>
  </div>
</template>
