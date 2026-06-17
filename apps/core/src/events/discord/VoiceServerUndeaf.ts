import Lacuna from '@/internals/Lacuna.js'
import { voiceAssign as economyVoiceAssign } from '@/modules/Economy.js'
import Levels from '@/modules/Levels.js'
import Logs from '@/modules/Logs/index.js'
import { VoiceState } from 'discord.js'

const handler = async (self: Lacuna, state: VoiceState) => {
    const server = await self.db.servers.fetch({ _id: state.guild.id })

    await Levels.onVoiceConnect(self, server, state)
    await economyVoiceAssign(self, server, state)
    await Logs.VoiceServerUndeaf(self, server, state)

    return true
}

export default {
    name: 'voiceServerUndeaf',
    handler
}
