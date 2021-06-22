const { VoiceMove } = require('../../modules/Logs')
const { CreateTempVoiceOnMove } = require('../../modules/VoiceManager')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').VoiceState} before
 * @param {import('discord.js').VoiceState} state
 */
const execute = async (self, before, state) => {
    const server = await self.db.servers.fetch({ _id: state.guild.id })

    const locale = self.translator.locale(server.locale).modules

    const connection = state.guild.me.voice.channel

    if (connection) {
        const listeners = connection.members.filter(m => !m.user.bot).size

        if ([before.channelID, state.channelID].includes(connection.id)) {
            await self.player.wait(state.guild.id, !Boolean(listeners))
        }
    }

    const old_voice_roles_bound = server.modules.voice_manager.voice_roles.filter(r => r.bound_channels_id.includes(before.channelID))
    const voice_roles_bound = server.modules.voice_manager.voice_roles.filter(r => r.bound_channels_id.includes(state.channelID))

    if (old_voice_roles_bound.length) {
        const voice_roles = state.guild.roles.cache.filter(r => r.editable && old_voice_roles_bound.some(b => b.role_id == r.id))

        if (voice_roles.size) await state.member.roles.remove(voice_roles, locale.voice_manager.voice_remove_roles_reason)
    }

    if (voice_roles_bound.length) {
        const voice_roles = state.guild.roles.cache.filter(r => r.editable && voice_roles_bound.some(b => b.role_id == r.id))

        if (voice_roles.size) await state.member.roles.add(voice_roles, locale.voice_manager.voice_remove_roles_reason)
    }

    await CreateTempVoiceOnMove(self, server, before, state)
    await VoiceMove(self, server, before, state)

    return true
}

module.exports = {
    name: 'voiceMove',
    fn: execute
}
