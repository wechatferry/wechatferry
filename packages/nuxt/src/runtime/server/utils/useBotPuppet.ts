import { WechatferryPuppet } from '@wechatferry/puppet'
import { useBotAgent } from './useBotAgent'

let puppet: WechatferryPuppet

export function useBotPuppet() {
  const agent = useBotAgent()
  if (!puppet) {
    puppet = new WechatferryPuppet({ agent })
  }

  return puppet
}
