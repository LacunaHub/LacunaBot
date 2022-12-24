import Lacuna from '../../internals/Lacuna'
import { capitalizeFirstLetter } from '../../internals/utility/Utils'

const handler = async (self: Lacuna, data: CommandExecutionData) => {
    const { command, subcommand, options, guild, channel, user } = data
    const commandStats = self.qdb.get(`stats.commands.${command}`)

    if (commandStats) {
        self.qdb.push(`stats.commands.${command}.data`, {
            timestamp: Date.now(),
            subcommand: subcommand ?? null,
            options: options ?? [],
            guild_id: guild.id,
            channel_id: channel.id,
            user_id: user.id
        })
        self.qdb.add(`stats.commands.${command}.total_uses`, 1)
    } else {
        self.qdb.set(`stats.commands.${command}`, {
            command,
            data: [
                {
                    timestamp: Date.now(),
                    subcommand: subcommand ?? null,
                    options: options ?? [],
                    guild_id: guild.id,
                    channel_id: channel.id,
                    user_id: user.id
                }
            ],
            total_uses: 1
        })
    }

    // prettier-ignore
    self.logger.log(
        `[${capitalizeFirstLetter(command)}Command] Execution from (${guild.name}:${guild.id}) and (${channel.name}:${channel.id}) for (${user.name}:${user.id})`
    )
}

export default {
    name: 'commandExecution',
    handler
}

export interface CommandExecutionData {
    command: string
    subcommand?: string
    options?: any[]
    guild: { name: string; id: string }
    channel: { name: string; id: string }
    user: { name: string; id: string }
}
