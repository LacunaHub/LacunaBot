import Lacuna from '../../internals/Lacuna'
import { capitalizeFirstLetter } from '../../internals/utility/Utils'

const handler = async (self: Lacuna, data: CommandExecutionData) => {
    const { command, subcommand, options, guild, channel, user } = data
    const commandStats: CommandStats = await self.db.qdb.get(`stats.commands.${command}`),
        isSystemCommand = self.commands.has(command)

    if (isSystemCommand) {
        if (commandStats) {
            commandStats.usages.push({
                timestamp: Date.now(),
                subcommand: subcommand ?? null,
                options: options ?? [],
                guild_id: guild.id,
                channel_id: channel.id,
                user_id: user.id
            })
            await self.db.qdb.set(
                `stats.commands.${command}.usages`,
                commandStats.usages.filter(i => Date.now() - i.timestamp < 1000 * 60 * 60 * 24)
            )
            await self.db.qdb.add(`stats.commands.${command}.total_uses`, 1)
        } else {
            await self.db.qdb.set(`stats.commands.${command}`, {
                command,
                usages: [
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
    }

    const capitalizedCommandName = capitalizeFirstLetter(command),
        capitalizedSubcommandName = subcommand ? capitalizeFirstLetter(subcommand) : '',
        commandOptions = options.map(i => i.options ?? i)

    self.logger.log(
        `[${capitalizedCommandName}${capitalizedSubcommandName}Command] Execution from (${guild.name}:${guild.id}) and (${channel.name}:${channel.id}) for (${user.name}:${user.id})`
    )

    await self.logger.appendServerLog(guild.id, {
        level: 'LOG',
        module: `${capitalizedCommandName}${capitalizedSubcommandName}Command`,
        message:
            `Executed in channel ${channel.id} for user ${user.id} ` +
            (commandOptions.length ? `with options ${JSON.stringify(commandOptions)}` : 'without options')
    })
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

export interface CommandStats {
    command: string
    usages: CommandStatsUsages[]
    total_uses: number
}

export interface CommandStatsUsages {
    timestamp: number
    subcommand?: string
    options: any[]
    guild_id: string
    channel_id: string
    user_id: string
}
