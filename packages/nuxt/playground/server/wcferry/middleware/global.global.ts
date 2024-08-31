export default defineBotMiddleware({
  hook: 'message',
  async handler(msg) {
    console.error(`${msg.talker().name()}: ${msg.text()}`)
  },
})
