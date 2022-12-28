import { Events } from 'discord.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, d) => {
    self.player?.updateVoiceState(d)

    return true
}

export default {
    name: Events.Raw,
    handler
}
