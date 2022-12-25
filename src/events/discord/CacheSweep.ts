import { Events } from 'discord.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, message: string) => {
    self.logger.log(`[DiscordCacheSweep] ${message}`)

    return true
}

export default {
    name: Events.CacheSweep,
    handler
}
