import { VoiceState } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { voiceAssign } from '../../modules/Levels'
import { VoiceServerUndeaf } from '../../modules/Logs'

const handler = async (self: Lacuna, state: VoiceState) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: state.guild.id })

    await voiceAssign(self, server, state)
    await VoiceServerUndeaf(self, server, state)

    return true
}

export default {
    name: 'voiceServerUndeaf',
    handler
}