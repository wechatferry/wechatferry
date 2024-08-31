export default defineBotMiddleware({
  hook: 'message',
  async handler(msg) {
    console.log(`${msg.talker().name()}: ${msg.text()}`)
  },
})
