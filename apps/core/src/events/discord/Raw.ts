import Lacuna from '@/internals/Lacuna.js'
import { Events, type GatewayDispatchPayload } from 'discord.js'

const handler = async (self: Lacuna, packet: GatewayDispatchPayload) => {
    await self.lava?.updateVoiceState?.(packet as any)

    return true
}

export default {
    name: Events.Raw,
    handler
}
