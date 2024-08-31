export default defineBotMiddleware({
  hook: 'message:room:mention',
  async handler(msg) {
    if (msg.text().includes('测试')) {
      msg.say('测试成功')
      return true
    }
  },
})
