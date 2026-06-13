import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, data: CommandExecutionData) => {
    const { guildId, channelId, userId, command, options } = data
    const commandStats: CommandStats = await self.db.qdb.get(`stats.commands.${command}`),
        isSystemCommand = self.commands.has(command)

    if (isSystemCommand) {
        if (commandStats) {
            commandStats.usages.push({
                timestamp: Date.now(),
                options: options ?? [],
                guild_id: guildId,
                channel_id: channelId,
                user_id: userId
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
                        options: options ?? [],
                        guild_id: guildId,
                        channel_id: channelId,
                        user_id: userId
                    }
                ],
                total_uses: 1
            })
        }
    }

    self.logger.info({ guildId, channelId, userId, command, options }, 'command execution')
}

export default {
    name: 'commandExecution',
    handler
}

export interface CommandExecutionData {
    guildId: string
    channelId: string
    userId: string
    command: string
    options?: any[]
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
