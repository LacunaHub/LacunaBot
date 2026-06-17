import { ServerModulesAutomationTriggers } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import Automation from '@/modules/custom-behavior/Automation.js'
import { voiceUnassign as economyVoiceUnassign } from '@/modules/Economy.js'
import GuildImageRotation from '@/modules/GuildImageRotation.js'
import Levels from '@/modules/Levels.js'
import Logs from '@/modules/Logs/index.js'
import { deleteTemporaryVoice } from '@/modules/VoiceManager.js'
import { VoiceChannel, VoiceState } from 'discord.js'

const handler = async (self: Lacuna, state: VoiceState, channel: VoiceChannel) => {
    const server = await self.db.servers.fetch({ _id: state.guild.id })
    const player = self.lava!.nodes.getPlayer(state.guild.id)

    if (player && !player.voiceChannelId && state.member!.id === self.user!.id) {
        await player.destroy()

        return
    }

    if (player && player.voiceChannelId === channel?.id) {
        const listeners: number = channel.members.filter(m => !m.user.bot).size

        if (!listeners) {
            await player.pause(true)
            player.set(
                'timeout',
                setTimeout(() => player.destroy(), 300000)
            )
        }
    }

    await self.fetchGuild(state.guild)
    await Automation.handleEvent(ServerModulesAutomationTriggers.VoiceDisconnect, self, server, state, {
        overwriteSignalProps: { channelId: channel.id }
    })
    await deleteTemporaryVoice(self, server, state, channel)
    await Levels.onVoiceDisconnect(self, server, state, channel)
    await economyVoiceUnassign(self, server, state, channel)

    const voiceRolesBound = server.modules.voice_manager.voice_roles
        .slice(0, server.premium.available ? 20 : 2)
        .filter(r => !r.bound_channels_id.length || r.bound_channels_id.includes(channel.id))

    if (voiceRolesBound.length) {
        const voice_roles = state.guild.roles.cache.filter(
            r => r.editable && voiceRolesBound.some(b => b.role_id == r.id)
        )

        try {
            if (voice_roles.size) {
                await state.member!.roles.remove(voice_roles, 'Voice roles')
            }
        } catch (err) {
            self.logger.error({ module: 'VoiceRoles', action: 'RemoveRoles', err, guildId: state.guild.id })
        }
    }

    await GuildImageRotation.rotateBanner(self, server, state.guild, state.member!)
    await Logs.VoiceDisconnect(self, server, state, channel)

    return true
}

export default {
    name: 'voiceDisconnect',
    handler
}
