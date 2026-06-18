import Lacuna from '@/internals/Lacuna.js'
import { voiceUnassign as economyVoiceUnassign } from '@/modules/Economy.js'
import Levels from '@/modules/Levels.js'
import Logs from '@/modules/Logs/index.js'
import { VoiceState } from 'discord.js'

const handler = async (self: Lacuna, state: VoiceState) => {
    const server = await self.db.servers.fetch({ _id: state.guild.id })

    await Levels.onVoiceDisconnect(self, server, state, state.channel!)
    await economyVoiceUnassign(self, server, state, state.channel!)
    await Logs.VoiceServerDeaf(self, server, state)

    return true
}

export default {
    name: 'voiceServerDeaf',
    handler
}
