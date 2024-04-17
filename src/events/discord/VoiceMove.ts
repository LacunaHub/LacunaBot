import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { VoiceState } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import Automation from '../../modules/Automation'
import { voiceAssign as economyVoiceAssign, voiceUnassign as economyVoiceUnassign } from '../../modules/Economy'
import Levels from '../../modules/Levels'
import Logs from '../../modules/Logs'
import { createTemporaryVoiceOnMove } from '../../modules/VoiceManager'

const handler = async (self: Lacuna, before: VoiceState, state: VoiceState) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: state.guild.id })

    const player = self.lava.nodes.getPlayer(state.guild.id)

    if (player) {
        const voice = [before, state].find(c => c.channelId === player.voiceChannelId)

        if (voice) {
            const listens = Boolean(voice.channel.members.filter(m => !m.user.bot).size)

            await player.pause(!listens)

            if (listens) {
                const timeout = player.get<NodeJS.Timeout>('timeout')

                if (timeout) {
                    clearTimeout(timeout)
                    player.set('timeout', null)
                }
            } else {
                player.set(
                    'timeout',
                    setTimeout(() => player.destroy(), 300000)
                )
            }
        }
    }

    await Automation.handleEvent('VOICE_CONNECT', self, server, state)
    await createTemporaryVoiceOnMove(self, server, before, state)
    await Levels.onVoiceDisconnect(self, server, before, before.channel)
    await Levels.onVoiceConnect(self, server, state)
    await economyVoiceUnassign(self, server, before, before.channel)
    await economyVoiceAssign(self, server, state)

    const oldVoiceRolesBound = server.modules.voice_manager.voice_roles
        .slice(0, server.premium.available ? 20 : 2)
        .filter(r => r.bound_channels_id.includes(before.channelId))
    const voiceRolesBound = server.modules.voice_manager.voice_roles
        .slice(0, server.premium.available ? 20 : 2)
        .filter(r => r.bound_channels_id.includes(state.channelId))

    if (oldVoiceRolesBound.length) {
        const voice_roles = state.guild.roles.cache.filter(r => r.editable && oldVoiceRolesBound.some(b => b.role_id == r.id))

        try {
            if (voice_roles.size) {
                await state.member.roles.remove(voice_roles, 'Voice roles')
            }
        } catch (err) {
            await self.logger.handleError({ module: 'VoiceRoles', action: 'RemoveRoles', error: err, guild_id: state.guild.id })
        }
    }

    if (voiceRolesBound.length) {
        const voice_roles = state.guild.roles.cache.filter(r => r.editable && voiceRolesBound.some(b => b.role_id == r.id))

        try {
            if (voice_roles.size) {
                await state.member.roles.add(voice_roles, 'Voice roles')
            }
        } catch (err) {
            await self.logger.handleError({ module: 'VoiceRoles', action: 'AddRoles', error: err, guild_id: state.guild.id })
        }
    }

    await Logs.VoiceMove(self, server, before, state)

    return true
}

export default {
    name: 'voiceMove',
    handler
}
