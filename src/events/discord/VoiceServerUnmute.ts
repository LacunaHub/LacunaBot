import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { VoiceState } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import { voiceAssign as economyVoiceAssign } from '../../modules/Economy'
import Levels from '../../modules/Levels'
import Logs from '../../modules/Logs'

const handler = async (self: Lacuna, state: VoiceState) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: state.guild.id })

    await Levels.onVoiceConnect(self, server, state)
    await economyVoiceAssign(self, server, state)
    await Logs.VoiceServerUnmute(self, server, state)

    return true
}

export default {
    name: 'voiceServerUnmute',
    handler
}
