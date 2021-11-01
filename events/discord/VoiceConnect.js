const { voiceAssign } = require('../../modules/Levels')
const VoiceConnect = require('../../modules/Logs/Voice/VoiceConnect')
const { CreateTempVoice } = require('../../modules/VoiceManager')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').VoiceState} state
 */
const handler = async (self, state) => {
    const server = await self.db.servers.fetch({ _id: state.guild.id })

    const locale = self.translator.locale(server.locale).modules

    const player = self.player.get(state.guild.id)

    if (player && state.channelId == player.voiceChannel) {
        const listeners = state.channel.members.filter(m => !m.user.bot).size

        if (listeners) {
            await player.pause(false)

            const timeout = player.get('timeout')

            if (timeout) {
                clearTimeout(timeout)
                player.set('timeout', null)
            }
        }
    }

    const voice_roles_bound = server.modules.voice_manager.voice_roles.filter(r => !r.bound_channels_id.length || r.bound_channels_id.includes(state.channelId))

    if (voice_roles_bound.length) {
        const voice_roles = state.guild.roles.cache.filter(r => r.editable && voice_roles_bound.some(b => b.role_id == r.id))

        if (voice_roles.size) await state.member.roles.add(voice_roles, locale.voice_manager.voice_add_roles_reason).catch(() => {})
    }
    
    await voiceAssign(self, server, state)
    await CreateTempVoice(self, server, state)
    await VoiceConnect(self, server, state)

    return true
}

module.exports = {
    name: 'voiceConnect',
    handler
}