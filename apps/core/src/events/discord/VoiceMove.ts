import { ServerModulesAutomationTriggers } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import Automation from '@/modules/custom-behavior/Automation.js'
import { voiceAssign as economyVoiceAssign, voiceUnassign as economyVoiceUnassign } from '@/modules/Economy.js'
import Levels from '@/modules/Levels.js'
import Logs from '@/modules/Logs/index.js'
import { createTemporaryVoiceOnMove } from '@/modules/VoiceManager.js'
import { VoiceState } from 'discord.js'

const handler = async (self: Lacuna, before: VoiceState, state: VoiceState) => {
    const server = await self.db.servers.fetch({ _id: state.guild.id })

    const player = self.lava!.nodes.getPlayer(state.guild.id)

    if (player) {
        const voice = [before, state].find(c => c.channelId === player.voiceChannelId)

        if (voice) {
            const listens = Boolean(voice.channel!.members.filter(m => !m.user.bot).size)

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

    await Automation.handleEvent(ServerModulesAutomationTriggers.VoiceConnect, self, server, state)
    await createTemporaryVoiceOnMove(self, server, before, state)
    await Levels.onVoiceDisconnect(self, server, before, before.channel!)
    await Levels.onVoiceConnect(self, server, state)
    await economyVoiceUnassign(self, server, before, before.channel!)
    await economyVoiceAssign(self, server, state)

    const oldVoiceRolesBound = server.modules.voice_manager.voice_roles
        .slice(0, 20)
        .filter(r => r.bound_channels_id.includes(before.channelId!))
    const voiceRolesBound = server.modules.voice_manager.voice_roles
        .slice(0, 20)
        .filter(r => r.bound_channels_id.includes(state.channelId!))

    if (oldVoiceRolesBound.length) {
        const voice_roles = state.guild.roles.cache.filter(
            r => r.editable && oldVoiceRolesBound.some(b => b.role_id == r.id)
        )

        try {
            if (voice_roles.size) {
                await state.member!.roles.remove(voice_roles, 'Voice roles')
            }
        } catch (err) {
            self.logger.error({ module: 'VoiceRoles', action: 'RemoveRoles', err, guildId: state.guild.id })
        }
    }

    if (voiceRolesBound.length) {
        const voice_roles = state.guild.roles.cache.filter(
            r => r.editable && voiceRolesBound.some(b => b.role_id == r.id)
        )

        try {
            if (voice_roles.size) {
                await state.member!.roles.add(voice_roles, 'Voice roles')
            }
        } catch (err) {
            self.logger.error({ module: 'VoiceRoles', action: 'AddRoles', err, guildId: state.guild.id })
        }
    }

    await Logs.VoiceMove(self, server, before, state)

    return true
}

export default {
    name: 'voiceMove',
    handler
}
