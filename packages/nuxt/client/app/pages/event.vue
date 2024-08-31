<script setup lang="ts">
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

definePageMeta({
  keepalive: true,
})

const container = ref<HTMLElement>()
let term: Terminal
let eventSource: EventSource
const isConnected = ref(false)

function createEventSource() {
  closeEventSource()
  eventSource = new EventSource(`${location.origin}/__wcferry__/sse`)
  eventSource.onmessage = (event) => {
    term?.writeln(event.data)
  }
  eventSource.onopen = () => {
    isConnected.value = true
  }
  eventSource.onerror = () => {
    isConnected.value = false
  }
  return eventSource
}

function closeEventSource() {
  isConnected.value = false
  eventSource?.close()
}

onMounted(() => {
  term = new Terminal({
    convertEol: true,
    cols: 80,
    screenReaderMode: true,
  })
  const fitAddon = new FitAddon()
  term.loadAddon(fitAddon)
  term.open(container.value!)
  fitAddon.fit()

  useEventListener(window, 'resize', () => {
    fitAddon.fit()
  })
  createEventSource()
})

async function clear() {
  term?.clear()
}

async function restart() {
  createEventSource()
}

async function terminate() {
  closeEventSource()
}
</script>

<template>
  <div
    class="flex flex-col h-full"
  >
    <div class="p-4 flex-1 of-hidden bg-black basis-0">
      <div
        ref="container"
        class="w-full h-full"
      />
    </div>
    <div
      border="t"
      class="n-border-base p-2"
      flex="~ justify-between items-center"
    >
      <div
        flex="~ gap-2"
        items-center
      >
        <NButton
          n="xl"
          title="Clear"
          icon="i-carbon-clean"
          :border="false"
          @click="clear()"
        />
        <NButton
          v-if="!isConnected"
          n="xl"
          title="Restart"
          icon="carbon-renew"
          :border="false"
          @click="restart()"
        />
        <NButton
          v-if="isConnected"
          n="xl"
          title="Terminate"
          icon="i-carbon-close-outline"
          :border="false"
          @click="terminate()"
        />
      </div>
      <div
        flex="~ gap-2"
        items-center
      >
        <div
          class="w-2 h-2 rounded-full"
          :class="!isConnected ? 'bg-red' : 'bg-green animate-flash'"
        />
        <div
          text-sm
          op50
        >
          {{ isConnected ? 'Connected' : 'Disconnected' }}
        </div>
      </div>
    </div>
  </div>
</template>
