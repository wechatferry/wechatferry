export default defineCronTask({
  // pattern: '* * * * *',
  async run() {
    const bot = useBot()
    console.error(`Hi, I am ${bot.currentUser.name()}, now is ${new Date()}`)
    return {
      result: true,
    }
  },
})
