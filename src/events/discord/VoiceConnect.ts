import { VoiceState } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { voiceAssign as economyVoiceAssign } from '../../modules/Economy'
import { voiceAssign as levelsVoiceAssign } from '../../modules/Levels'
import { VoiceConnect } from '../../modules/Logs'
import { createTemporaryVoice } from '../../modules/VoiceManager'

const handler = async (self: Lacuna, state: VoiceState) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: state.guild.id })

    const player = self.player.get(state.guild.id)

    if (player && state.channelId == player.voiceChannel) {
        const listeners: number = state.channel.members.filter(m => !m.user.bot).size

        if (listeners) {
            player.pause(false)

            const timeout = player.get<NodeJS.Timeout>('timeout')

            if (timeout) {
                clearTimeout(timeout)
                player.set('timeout', null)
            }
        }
    }

    const voice_roles_bound = server.modules.voice_manager.voice_roles
        .slice(0, server.server.premium.available ? 20 : 2)
        .filter(r => !r.bound_channels_id.length || r.bound_channels_id.includes(state.channelId))

    if (voice_roles_bound.length) {
        const voice_roles = state.guild.roles.cache.filter(r => r.editable && voice_roles_bound.some(b => b.role_id == r.id))

        if (voice_roles.size) await state.member.roles.add(voice_roles).catch(() => {})
    }

    await levelsVoiceAssign(self, server, state)
    await economyVoiceAssign(self, server, state)

    await createTemporaryVoice(self, server, state)
    await VoiceConnect(self, server, state)

    return true
}

export default {
    name: 'voiceConnect',
    handler
}
