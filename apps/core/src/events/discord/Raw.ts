import { Events, GatewayDispatchPayload } from 'discord.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, packet: GatewayDispatchPayload) => {
    await self.lava?.updateVoiceState?.(packet as any)

    return true
}

export default {
    name: Events.Raw,
    handler
}
