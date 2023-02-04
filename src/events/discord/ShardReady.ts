import { Events } from 'discord.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, id: number, unavailableGuilds: Set<string>) => {
    if (self.cluster.id === 0) {
        await self.db.qdb.set(
            'commands',
            self.commands
                .filter(c => !c.private)
                .map(c => {
                    const {
                        name,
                        pretty_name,
                        description,
                        options,
                        group,
                        premium_only,
                        is_prefix_command,
                        is_slash_command,
                        is_user_command,
                        is_message_command,
                        permissions
                    } = c

                    return {
                        name,
                        pretty_name,
                        description,
                        options,
                        group,
                        premium_only,
                        is_prefix_command,
                        is_slash_command,
                        is_user_command,
                        is_message_command,
                        permissions
                    }
                })
        )

        self.logger.log('[DiscordShardReady] Commands cache is written')
    }

    self.logger.info(`[DiscordShardReady] Shard #${id} of cluster #${self.cluster.id} is ready`)
    await self.logger.telegram.info(`\`[DiscordShardReady]\` Shard #${id} of cluster #${self.cluster.id} is ready`)

    if (unavailableGuilds?.size) {
        self.logger.warn(`[DiscordShardReady] Found unavailable guilds`, ...unavailableGuilds.keys())
    }

    return true
}

export default {
    name: Events.ShardReady,
    handler,
    once: true,
    initial: true
}
