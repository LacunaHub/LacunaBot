import { VoiceState } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { voiceAssign as economyVoiceAssign, voiceUnassign as economyVoiceUnassign } from '../../modules/Economy'
import { voiceAssign as levelsVoiceAssign, voiceUnassign as levelsVoiceUnassign } from '../../modules/Levels'
import { VoiceMove } from '../../modules/Logs'
import { createTemporaryVoiceOnMove } from '../../modules/VoiceManager'

const handler = async (self: Lacuna, before: VoiceState, state: VoiceState) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: state.guild.id })

    const player = self.player.get(state.guild.id)

    if (player) {
        const voice = [before, state].find(c => c.channelId == player.voiceChannel)

        if (voice) {
            const listens = Boolean(voice.channel.members.filter(m => !m.user.bot).size)

            player.pause(!listens)

            if (listens) {
                const timeout = player.get<NodeJS.Timeout>('timeout')

                if (timeout) {
                    clearTimeout(timeout)
                    player.set('timeout', null)
                }
            } else {
                player.set(
                    'timeout',
                    setTimeout(() => player.destroy(), 600000)
                )
            }
        }
    }

    const old_voice_roles_bound = server.modules.voice_manager.voice_roles
        .slice(0, server.server.premium.available ? 20 : 2)
        .filter(r => r.bound_channels_id.includes(before.channelId))
    const voice_roles_bound = server.modules.voice_manager.voice_roles
        .slice(0, server.server.premium.available ? 20 : 2)
        .filter(r => r.bound_channels_id.includes(state.channelId))

    if (old_voice_roles_bound.length) {
        const voice_roles = state.guild.roles.cache.filter(r => r.editable && old_voice_roles_bound.some(b => b.role_id == r.id))

        if (voice_roles.size) await state.member.roles.remove(voice_roles).catch(self.logger.error)
    }

    if (voice_roles_bound.length) {
        const voice_roles = state.guild.roles.cache.filter(r => r.editable && voice_roles_bound.some(b => b.role_id == r.id))

        if (voice_roles.size) await state.member.roles.add(voice_roles).catch(self.logger.error)
    }

    await levelsVoiceUnassign(self, server, before, before.channel)
    await levelsVoiceAssign(self, server, state)

    await economyVoiceUnassign(self, server, before, before.channel)
    await economyVoiceAssign(self, server, state)

    await createTemporaryVoiceOnMove(self, server, before, state)
    await VoiceMove(self, server, before, state)

    return true
}

export default {
    name: 'voiceMove',
    handler
}
