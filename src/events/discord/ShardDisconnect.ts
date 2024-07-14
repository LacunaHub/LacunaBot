import { CloseEvent, Events } from 'discord.js'
import Lacuna from '../../internals/Lacuna'

async function handler(self: Lacuna, event: CloseEvent, id: number) {
    self.logger.warn(`[DiscordShardDisconnect] Shard #${id} of cluster #${self.cluster.id} disconnected`)
    await self.logger.telegram.warn(`\`[DiscordShardDisconnect]\` Shard #${id} of cluster #${self.cluster.id} disconnected`)

    return true
}

export default {
    name: Events.ShardDisconnect,
    handler
}
