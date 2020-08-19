const { VoiceServerMute } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').VoiceState} state
 */
const execute = async (self, state) => {
    const server = await self.db.servers.fetch({ _id: state.guild.id })

    await VoiceServerMute(self, server, state)

    return true
}

module.exports = {
    name: 'voiceServerMute',
    fn: execute
}