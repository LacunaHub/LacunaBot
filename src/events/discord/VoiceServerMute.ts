import { VoiceState } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { voiceUnassign } from '../../modules/Levels'
import { VoiceServerMute } from '../../modules/Logs'

const handler = async (self: Lacuna, state: VoiceState) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: state.guild.id })

    await voiceUnassign(self, server, state, state.channel)
    await VoiceServerMute(self, server, state)

    return true
}

export default {
    name: 'voiceServerMute',
    handler
}