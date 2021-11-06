const { MessageDelete } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').Message} message
 */
const handler = async (self, message) => {
    if (message.partial || message.author.bot || message.channel.type == 'DM') return false

    const server = await self.db.servers.fetch({ _id: message.guild.id })

    await MessageDelete(self, server, message)

    return true
}

module.exports = {
    name: 'messageDelete',
    handler
}