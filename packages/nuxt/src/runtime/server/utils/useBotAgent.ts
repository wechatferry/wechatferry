import { WechatferryAgent } from '@wechatferry/agent'

let agent: WechatferryAgent

export function useBotAgent() {
  if (!agent) {
    agent = new WechatferryAgent()
  }

  return agent
}
