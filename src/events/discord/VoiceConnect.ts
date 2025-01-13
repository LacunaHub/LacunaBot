import { ServerDocument, ServerModulesAutomationTriggers } from '@lacunahub/lacuna-database-driver'
import { VoiceState } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import Automation from '../../modules/custom-behavior/Automation'
import { voiceAssign as economyVoiceAssign } from '../../modules/Economy'
import GuildImageRotation from '../../modules/GuildImageRotation'
import Levels from '../../modules/Levels'
import Logs from '../../modules/Logs'
import { createTemporaryVoice } from '../../modules/VoiceManager'

const handler = async (self: Lacuna, state: VoiceState) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: state.guild.id })
    const player = self.lava.nodes.getPlayer(state.guild.id)

    if (player && player.voiceChannelId === state.channelId) {
        const listeners: number = state.channel.members.filter(m => !m.user.bot).size

        if (listeners) {
            await player.pause(false)

            const timeout = player.get<NodeJS.Timeout>('timeout')

            if (timeout) {
                clearTimeout(timeout)
                player.set('timeout', null)
            }
        }
    }

    await self.fetchGuild(state.guild)
    await Automation.handleEvent(ServerModulesAutomationTriggers.VoiceConnect, self, server, state)
    await createTemporaryVoice(self, server, state)
    await Levels.onVoiceConnect(self, server, state)
    await economyVoiceAssign(self, server, state)

    const voiceRolesBound = server.modules.voice_manager.voice_roles
        .slice(0, server.premium.available ? 20 : 2)
        .filter(r => !r.bound_channels_id.length || r.bound_channels_id.includes(state.channelId))

    if (voiceRolesBound.length) {
        const voiceRoles = state.guild.roles.cache.filter(r => r.editable && voiceRolesBound.some(b => b.role_id === r.id))

        try {
            if (voiceRoles.size) {
                await state.member.roles.add(voiceRoles, 'Voice roles')
            }
        } catch (err) {
            await self.logger.handleError({ module: 'VoiceRoles', action: 'AddRoles', error: err, guild_id: state.guild.id })
        }
    }

    await GuildImageRotation.rotateBanner(self, server, state.guild, state.member)
    await Logs.VoiceConnect(self, server, state)

    return true
}

export default {
    name: 'voiceConnect',
    handler
}
