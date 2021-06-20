const VoiceServerUnmute = require('../../modules/Logs/Voice/VoiceServerUnmute')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').VoiceState} state
 */
const execute = async (self, state) => {
    const server = await self.db.servers.fetch({ _id: state.guild.id })

    await VoiceServerUnmute(self, server, state)

    return true
}

module.exports = {
    name: 'voiceServerUnmute',
    fn: execute
}