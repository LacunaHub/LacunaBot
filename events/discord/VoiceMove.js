const { voiceUnassign, voiceAssign } = require('../../modules/Levels')
const { VoiceMove } = require('../../modules/Logs')
const { CreateTempVoiceOnMove } = require('../../modules/VoiceManager')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').VoiceState} before
 * @param {import('discord.js').VoiceState} state
 */
const handler = async (self, before, state) => {
    const server = await self.db.servers.fetch({ _id: state.guild.id })

    const locale = self.translator.locale(server.locale).modules

    const player = self.player.get(state.guild.id)

    if (player) {
        const voice = [before, state].find(c => c.channelId == player.voiceChannel)

        if (voice) {
            const listens = Boolean(voice.channel.members.filter(m => !m.user.bot).size)

            await player.pause(!listens)

            if (listens) {
                const timeout = player.get('timeout')
    
                if (timeout) {
                    clearTimeout(timeout)
                    player.set('timeout', null)
                }
            }

            else {
                await player.set('timeout', setTimeout(
                    () => player.destroy(), 600000
                ))
            }
        }
    }

    const old_voice_roles_bound = server.modules.voice_manager.voice_roles.filter(r => r.bound_channels_id.includes(before.channelId))
    const voice_roles_bound = server.modules.voice_manager.voice_roles.filter(r => r.bound_channels_id.includes(state.channelId))

    if (old_voice_roles_bound.length) {
        const voice_roles = state.guild.roles.cache.filter(r => r.editable && old_voice_roles_bound.some(b => b.role_id == r.id))

        if (voice_roles.size) await state.member.roles.remove(voice_roles, locale.voice_manager.voice_remove_roles_reason).catch(self.logger.error)
    }

    if (voice_roles_bound.length) {
        const voice_roles = state.guild.roles.cache.filter(r => r.editable && voice_roles_bound.some(b => b.role_id == r.id))

        if (voice_roles.size) await state.member.roles.add(voice_roles, locale.voice_manager.voice_remove_roles_reason).catch(self.logger.error)
    }

    await voiceUnassign(self, server, before, before.channel)
    await voiceAssign(self, server, state)

    await CreateTempVoiceOnMove(self, server, before, state)
    await VoiceMove(self, server, before, state)

    return true
}

module.exports = {
    name: 'voiceMove',
    handler
}
