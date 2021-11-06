const { voiceAssign } = require('../../modules/Levels')
const { VoiceServerUndeaf } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').VoiceState} state
 */
const handler = async (self, state) => {
    const server = await self.db.servers.fetch({ _id: state.guild.id })

    await voiceAssign(self, server, state)
    await VoiceServerUndeaf(self, server, state)

    return true
}

module.exports = {
    name: 'voiceServerUndeaf',
    handler
}