import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, data: CommandExecutionData) => {
    const { command, guild, channel, user } = data

    self.logger.log(`(Command: ${command}): (${guild.name}:${guild.id}) (${channel.name}:${channel.id}) (${user.name}:${user.id})`)
}

export default {
    name: 'commandExecution',
    handler
}

export interface CommandExecutionData {
    command: string
    guild: { name: string; id: string }
    channel: { name: string; id: string }
    user: { name: string; id: string }
}
