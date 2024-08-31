<script setup lang="ts">
definePageMeta({
  keepalive: true,
})
const skills = useServerSkills()
</script>

<template>
  <div
    v-for="(item, index) in skills"
    :key="item.path"
    class="flex items-center gap-2 n-border-base py-2"
  >
    <div
      class="w8
        text-right
        text-sm
        op25"
    >
      {{ index + 1 }}
    </div>
    <NBadge n="orange">
      {{ item.name }}
    </NBadge>
    <div class="hover:underline ws-nowrap of-hidden truncate font-mono op-50">
      {{ item.fullPath }}
    </div>
  </div>
</template>
