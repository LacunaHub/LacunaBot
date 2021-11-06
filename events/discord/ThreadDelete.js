const { ThreadDelete } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').ThreadChannel} thread
 */
 const handler = async (self, thread) => {
    const server = await self.db.servers.find({ _id: thread.guild.id })

    if (!server) return false

    await ThreadDelete(self, server, thread)

    return true
}

module.exports = {
    name: 'threadDelete',
    handler
}