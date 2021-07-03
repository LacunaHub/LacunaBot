const { voiceAssign } = require('../../modules/Levels')
const VoiceConnect = require('../../modules/Logs/Voice/VoiceConnect')
const { CreateTempVoice } = require('../../modules/VoiceManager')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').VoiceState} state
 */
const execute = async (self, state) => {
    const server = await self.db.servers.fetch({ _id: state.guild.id })

    const locale = self.translator.locale(server.locale).modules

    const connection = state.guild.me.voice.channel

    if (connection) {
        const listeners = connection.members.filter(m => !m.user.bot).size

        if (listeners && connection.id == state.member.voice.channelID) {
            await self.player.wait(state.guild.id, false)
        }
    }

    const voice_roles_bound = server.modules.voice_manager.voice_roles.filter(r => !r.bound_channels_id.length || r.bound_channels_id.includes(state.channelID))

    if (voice_roles_bound.length) {
        const voice_roles = state.guild.roles.cache.filter(r => r.editable && voice_roles_bound.some(b => b.role_id == r.id))

        if (voice_roles.size) await state.member.roles.add(voice_roles, locale.voice_manager.voice_add_roles_reason).catch(self.logger.error)
    }
    
    await voiceAssign(self, server, state)
    await CreateTempVoice(self, server, state)
    await VoiceConnect(self, server, state)

    return true
}

module.exports = {
    name: 'voiceConnect',
    fn: execute
}