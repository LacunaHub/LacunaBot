const { ThreadCreate } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').ThreadChannel} thread
 */
const handler = async (self, thread) => {
    const server = await self.db.servers.find({ _id: thread.guild.id })

    if (!server) return false

    await ThreadCreate(self, server, thread)

    return true
}

module.exports = {
    name: 'threadCreate',
    handler
}