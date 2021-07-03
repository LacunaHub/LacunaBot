const { voiceAssign } = require('../../modules/Levels')
const VoiceServerUndeaf = require('../../modules/Logs/Voice/VoiceServerUndeaf')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').VoiceState} state
 */
const execute = async (self, state) => {
    const server = await self.db.servers.fetch({ _id: state.guild.id })

    await voiceAssign(self, server, state)
    await VoiceServerUndeaf(self, server, state)

    return true
}

module.exports = {
    name: 'voiceServerUndeaf',
    fn: execute
}