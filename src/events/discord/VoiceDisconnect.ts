import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { VoiceChannel, VoiceState } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import { fetchGuild } from '../../internals/utility/Utils'
import Automation from '../../modules/Automation'
import { voiceUnassign as economyVoiceUnassign } from '../../modules/Economy'
import GuildImageRotation from '../../modules/GuildImageRotation'
import Levels from '../../modules/Levels'
import Logs from '../../modules/Logs'
import { deleteTemporaryVoice } from '../../modules/VoiceManager'

const handler = async (self: Lacuna, state: VoiceState, channel: VoiceChannel) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: state.guild.id })
    const player = self.lava.nodes.getPlayer(state.guild.id)

    if (player && !player.voiceChannelId && state.member.id === self.user.id) {
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

    await fetchGuild(self.cache, state.guild)
    await Automation.handleEvent('VOICE_DISCONNECT', self, server, state, { channelId: channel.id })
    await deleteTemporaryVoice(self, server, state, channel)
    await Levels.onVoiceDisconnect(self, server, state, channel)
    await economyVoiceUnassign(self, server, state, channel)

    const voiceRolesBound = server.modules.voice_manager.voice_roles
        .slice(0, server.premium.available ? 20 : 2)
        .filter(r => !r.bound_channels_id.length || r.bound_channels_id.includes(channel.id))

    if (voiceRolesBound.length) {
        const voice_roles = state.guild.roles.cache.filter(r => r.editable && voiceRolesBound.some(b => b.role_id == r.id))

        try {
            if (voice_roles.size) {
                await state.member.roles.remove(voice_roles, 'Voice roles')
            }
        } catch (err) {
            await self.logger.handleError({ module: 'VoiceRoles', action: 'RemoveRoles', error: err, guild_id: state.guild.id })
        }
    }

    await GuildImageRotation.rotateBanner(self, server, state.guild, state.member)
    await Logs.VoiceDisconnect(self, server, state, channel)

    return true
}

export default {
    name: 'voiceDisconnect',
    handler
}
