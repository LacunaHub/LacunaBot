import { VoiceState } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { voiceUnassign as levelsVoiceUnassign } from '../../modules/Levels'
import { voiceUnassign as economyVoiceUnassign } from '../../modules/Economy'
import { VoiceServerMute } from '../../modules/Logs'

const handler = async (self: Lacuna, state: VoiceState) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: state.guild.id })

    await levelsVoiceUnassign(self, server, state, state.channel)
    await economyVoiceUnassign(self, server, state, state.channel)
    await VoiceServerMute(self, server, state)

    return true
}

export default {
    name: 'voiceServerMute',
    handler
}