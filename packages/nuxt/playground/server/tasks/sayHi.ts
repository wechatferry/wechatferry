export default defineCronTask({
  // pattern: '* * * * *',
  async run() {
    const bot = useBot()
    console.log(`Hi, I am ${bot.currentUser.name()}, now is ${new Date()}`)
    return {
      result: true,
    }
  },
})
