import { WechatferryAgent } from '@wechatferry/agent'
import { useRuntimeConfig } from 'nitropack/runtime'

let agent: WechatferryAgent

export function useBotAgent() {
  const { wcferry: { keepalive } } = useRuntimeConfig()
  if (!agent) {
    agent = new WechatferryAgent({
      keepalive,
    })
  }

  return agent
}
