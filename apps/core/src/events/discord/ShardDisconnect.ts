import Lacuna from '@/internals/Lacuna.js'
import { type CloseEvent, Events } from 'discord.js'

async function handler(self: Lacuna, event: CloseEvent, id: number) {
    self.logger.warn({ shardId: id, event }, 'shard disconnected')

    return true
}

export default {
    name: Events.ShardDisconnect,
    handler
}
