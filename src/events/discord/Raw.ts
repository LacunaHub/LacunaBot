import { Events } from 'discord.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, packet: any) => {
    await self.lava?.updateVoiceState?.(packet)

    return true
}

export default {
    name: Events.Raw,
    handler
}
