import type * as PUPPET from 'wechaty-puppet'
import pThrottle from 'p-throttle'

export function createSafeModePuppet<T extends PUPPET.Puppet>(puppet: T) {
  // 记录上次发送消息的 conversationId
  let lastConversationId: string | null = null

  // 存储不同 conversationId 的 throttle 函数
  const throttles = new Map()

  // 每分钟最多只能发 40 条消息的 throttle
  const globalThrottle = pThrottle({
    limit: 40,
    interval: 60000, // 60秒内最多40次
  })

  // 根据不同的对象进行间隔发送的节流器生成
  function getThrottle(conversationId: string) {
    if (throttles.has(conversationId)) {
      return throttles.get(conversationId)
    }
    const throttle = pThrottle({
      limit: 1, // 每次只能发一条消息
      interval: 3000, // 设置间隔
    })
    throttles.set(conversationId, throttle)
    return throttle
  }

  // 模拟不同对象之间的延迟3~5秒
  async function applyDelayForDifferentConversations(conversationId: string) {
    if (lastConversationId !== conversationId) {
      const delay = Math.random() * 2000 + 3000 // 3000ms到5000ms之间
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    lastConversationId = conversationId
  }

  // 创建代理，拦截所有以 messageSend 开头的方法
  return new Proxy(puppet, {
    // @ts-expect-error untyped
    get(target, prop: keyof T, receiver) {
      const raw = Reflect.get(target, prop, receiver)
      // 如果方法是以 'messageSend' 开头的，我们拦截并应用节流逻辑
      if (typeof prop === 'string' && typeof target[prop] === 'function' && prop.startsWith('messageSend')) {
        return async function (...args: any[]) {
          const conversationId = args[0]

          // 获取局部节流器
          const throttle = getThrottle(conversationId)

          // 执行全局节流器逻辑
          const sendMessageGloballyThrottled = globalThrottle(async () => {
            // 不同对象之间延迟 3~5 秒
            await applyDelayForDifferentConversations(conversationId)

            // 应用单个对象的节流逻辑
            // @ts-expect-error untyped
            const sendMessageLocallyThrottled = throttle(() => target[prop](...args))
            return sendMessageLocallyThrottled()
          })

          // 执行消息发送
          return await sendMessageGloballyThrottled()
        }
      }
      return raw
    },
  })
}
