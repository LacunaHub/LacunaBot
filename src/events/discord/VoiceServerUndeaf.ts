import { VoiceState } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { voiceAssign as economyVoiceAssign } from '../../modules/Economy'
import { voiceAssign as levelsVoiceAssign } from '../../modules/Levels'
import Logs from '../../modules/Logs'

const handler = async (self: Lacuna, state: VoiceState) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: state.guild.id })

    await levelsVoiceAssign(self, server, state)
    await economyVoiceAssign(self, server, state)
    await Logs.VoiceServerUndeaf(self, server, state)

    return true
}

export default {
    name: 'voiceServerUndeaf',
    handler
}
