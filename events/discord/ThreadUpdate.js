const { ThreadUpdate } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').ThreadChannel} before
 * @param {import('discord.js').ThreadChannel} thread
 */
 const handler = async (self, before, thread) => {
    const server = await self.db.servers.find({ _id: thread.guild.id })

    if (!server) return false

    await ThreadUpdate(self, server, before, thread)

    return true
}

module.exports = {
    name: 'threadUpdate',
    handler
}