const { voiceAssign } = require('../../modules/Levels')
const { VoiceServerUnmute } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').VoiceState} state
 */
const handler = async (self, state) => {
    const server = await self.db.servers.fetch({ _id: state.guild.id })

    await voiceAssign(self, server, state)
    await VoiceServerUnmute(self, server, state)

    return true
}

module.exports = {
    name: 'voiceServerUnmute',
    handler
}