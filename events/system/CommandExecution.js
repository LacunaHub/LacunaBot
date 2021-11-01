/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').CommandExecutionData} data
 */
const handler = async (self, data) => {
    const { command, guild, channel, user } = data

    self.logger.log(`(Command: ${command}): (${guild.name}:${guild.id}) (${channel.name}:${channel.id}) (${user.name}:${user.id})`)
}

module.exports = {
    name: 'commandExecution',
    handler
}