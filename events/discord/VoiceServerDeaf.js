const { voiceUnassign } = require('../../modules/Levels')
const { VoiceServerDeaf } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').VoiceState} state
 */
const handler = async (self, state) => {
    const server = await self.db.servers.fetch({ _id: state.guild.id })

    await voiceUnassign(self, server, state, state.channel)
    await VoiceServerDeaf(self, server, state)

    return true
}

module.exports = {
    name: 'voiceServerDeaf',
    handler
}