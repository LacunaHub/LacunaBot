import { CloseEvent, Events } from 'discord.js'
import Lacuna from '../../internals/Lacuna'

async function handler(self: Lacuna, event: CloseEvent, id: number) {
    self.logger.warn({ shardId: id, event }, 'shard disconnected')

    return true
}

export default {
    name: Events.ShardDisconnect,
    handler
}
