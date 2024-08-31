export default defineBotCommandHandler({
  command: 'ping',
  handler({ message }) {
    message.say('pong')
  },
  middleware: 'local',
})
