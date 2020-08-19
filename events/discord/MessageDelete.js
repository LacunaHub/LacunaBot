const { MessageDelete } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').Message} message
 */
const execute = async (self, message) => {
    if (message.partial || message.author.bot || message.channel.type == 'dm') return null

    const server = await self.db.servers.fetch({ _id: message.guild.id })

    await MessageDelete(self, server, message)

    await message.channel.messages.cache.delete(message.id)

    return true
}

module.exports = {
    name: 'messageDelete',
    fn: execute
}