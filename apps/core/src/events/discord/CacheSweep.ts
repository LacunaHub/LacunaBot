import Lacuna from '@/internals/Lacuna.js'
import { Events } from 'discord.js'

const handler = async (self: Lacuna, message: string) => {
    self.logger.info(message)

    return true
}

export default {
    name: Events.CacheSweep,
    handler
}
