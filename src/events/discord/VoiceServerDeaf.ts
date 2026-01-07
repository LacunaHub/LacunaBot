import { ServerDocument } from '@/database/schemas/Servers'
import { VoiceState } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import { voiceUnassign as economyVoiceUnassign } from '../../modules/Economy'
import Levels from '../../modules/Levels'
import Logs from '../../modules/Logs'

const handler = async (self: Lacuna, state: VoiceState) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: state.guild.id })

    await Levels.onVoiceDisconnect(self, server, state, state.channel)
    await economyVoiceUnassign(self, server, state, state.channel)
    await Logs.VoiceServerDeaf(self, server, state)

    return true
}

export default {
    name: 'voiceServerDeaf',
    handler
}
