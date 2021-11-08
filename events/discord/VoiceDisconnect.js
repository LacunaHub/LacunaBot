const { voiceUnassign } = require('../../modules/Levels')
const { VoiceDisconnect } = require('../../modules/Logs')
const { DeleteTempVoice } = require('../../modules/VoiceManager')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').VoiceState} state
 * @param {import('discord.js').VoiceChannel} channel
 */
const handler = async (self, state, channel) => {
    const server = await self.db.servers.fetch({ _id: state.guild.id })

    const locale = self.translator.locale(server.locale).modules

    const player = self.player.get(state.guild.id)

    if (player && channel?.id == player.voiceChannel) {
        const listeners = channel.members.filter(m => !m.user.bot).size

        if (!listeners) {
            await player.pause(true)
            await player.set('timeout', setTimeout(
                () => player.destroy(), 600000
            ))
        }
    }

    const voice_roles_bound = server.modules.voice_manager.voice_roles.filter(r => !r.bound_channels_id.length || r.bound_channels_id.includes(channel.id))

    if (voice_roles_bound.length) {
        const voice_roles = state.guild.roles.cache.filter(r => r.editable && voice_roles_bound.some(b => b.role_id == r.id))

        if (voice_roles.size) await state.member.roles.remove(voice_roles, locale.voice_manager.voice_remove_roles_reason).catch(self.logger.error)
    }

    await voiceUnassign(self, server, state, channel)
    await DeleteTempVoice(self, server, channel)
    await VoiceDisconnect(self, server, state, channel)

    return true
}

module.exports = {
    name: 'voiceDisconnect',
    handler
}