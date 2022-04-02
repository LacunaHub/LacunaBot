import { VoiceChannel, VoiceState } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { voiceUnassign as levelsVoiceUnassign } from '../../modules/Levels'
import { voiceUnassign as economyVoiceUnassign } from '../../modules/Economy'
import { VoiceDisconnect } from '../../modules/Logs'
import { deleteTemporaryVoice } from '../../modules/VoiceManager'

const handler = async (self: Lacuna, state: VoiceState, channel: VoiceChannel) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: state.guild.id })

    const locale = self.translator.locale(server.locale).modules

    const player = self.player.get(state.guild.id)

    if (player && channel?.id == player.voiceChannel) {
        const listeners: number = channel.members.filter(m => !m.user.bot).size

        if (!listeners) {
            player.pause(true)
            player.set('timeout', setTimeout(
                () => player.destroy(), 600000
            ))
        }
    }

    const voice_roles_bound = server.modules.voice_manager.voice_roles
        .slice(0, (server.server.premium.available ? 20 : 2))
        .filter(r => !r.bound_channels_id.length || r.bound_channels_id.includes(channel.id))

    if (voice_roles_bound.length) {
        const voice_roles = state.guild.roles.cache.filter(r => r.editable && voice_roles_bound.some(b => b.role_id == r.id))

        if (voice_roles.size) await state.member.roles.remove(voice_roles, locale.voice_manager.voice_remove_roles_reason).catch(self.logger.error)
    }

    await levelsVoiceUnassign(self, server, state, channel)
    await economyVoiceUnassign(self, server, state, channel)

    await deleteTemporaryVoice(self, server, channel)
    await VoiceDisconnect(self, server, state, channel)

    return true
}

export default {
    name: 'voiceDisconnect',
    handler
}