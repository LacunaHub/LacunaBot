const help = require('../../commands/general/help')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').Message} message
 */
const execute = async (self, message) => {
    if (message.author.bot || message.channel.type == 'dm') return null

    const server = await self.db.servers.fetch({ _id: message.guild.id })

    const splitted = message.content.split(' ')
    const command_name = splitted[0].toLowerCase()
    const args = splitted.slice(1).filter(arg => arg)

    const command = self.commands.get(command_name.slice(server.prefix.length)) || self.commands.find(c => c.aliases && c.aliases.includes(command_name.slice(server.prefix.length)))

    if (command) {
        await command.execute(server, message, args)
    }

    if (message.content.trim().startsWith(`<@!${self.user.id}>`) && message.content.trim().length == `<@!${self.user.id}>`.length) {
        await help.fn(self, server, message, args)
    }

    return true
}

module.exports = {
    name: 'message',
    fn: execute
}