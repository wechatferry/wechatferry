<script lang="ts">
export default defineComponent({
  name: 'DefaultLayout',
})
</script>

<template>
  <div
    class="h-screen flex flex-col"
  >
    <header>
      <NavBar />
    </header>
    <main class="flex-1 of-auto">
      <slot />
    </main>
  </div>
</template>
