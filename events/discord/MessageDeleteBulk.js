const MessageDeleteBulk = require('../../modules/Logs/Message/MessageDeleteBulk')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').Collection<String, import('discord.js').Message>} messages
 */
const handler = async (self, messages) => {
    const message = messages.first()

    const server = await self.db.servers.fetch({ _id: message.guild.id })

    await MessageDeleteBulk(self, server, messages)

    return true
}

module.exports = {
    name: 'messageDeleteBulk',
    handler
}