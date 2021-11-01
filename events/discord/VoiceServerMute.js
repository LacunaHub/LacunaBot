const { voiceUnassign } = require('../../modules/Levels')
const VoiceServerMute = require('../../modules/Logs/Voice/VoiceServerMute')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').VoiceState} state
 */
const handler = async (self, state) => {
    const server = await self.db.servers.fetch({ _id: state.guild.id })

    await voiceUnassign(self, server, state, state.channel)
    await VoiceServerMute(self, server, state)

    return true
}

module.exports = {
    name: 'voiceServerMute',
    handler
}