import Lacuna from '@/internals/Lacuna.js'
import { Events, GatewayDispatchEvents, type GatewayDispatchPayload } from 'discord.js'

const handler = async (self: Lacuna, packet: GatewayDispatchPayload) => {
    if (packet.t === GatewayDispatchEvents.VoiceServerUpdate || packet.t === GatewayDispatchEvents.VoiceStateUpdate) {
        if (self.lava) await self.lava.updateVoiceState(packet)
    }

    return true
}

export default {
    name: Events.Raw,
    handler
}
