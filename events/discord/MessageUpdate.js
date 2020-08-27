const { MessageUpdate } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').Message} before
 * @param {import('discord.js').Message} message
 */
const execute = async (self, before, message) => {
    let partial = false

    if (before.partial) {
        before = await before.fetch()
        if (message.partial) message = await message.fetch()
        partial = true
    }

    if (message.author.bot || message.channel.type == 'dm') return false
    if ((!before.embeds.length && message.embeds.length) || (!before.pinned && message.pinned)) return false

    const server = await self.db.servers.fetch({ _id: message.guild.id })

    const splitted = message.content.split(' ')
    const command_name = splitted[0].toLowerCase()
    const args = splitted.slice(1).filter(arg => arg)

    const command = self.commands.get(command_name.slice(server.prefix.length)) || self.commands.find(c => c.aliases && c.aliases.includes(command_name.slice(server.prefix.length)))

    if (command) {
        await command.execute(server, message, args)
    }

    await MessageUpdate(self, server, before, message)

    if (partial) await message.channel.messages.cache.sweep(m => [before.id, message.id].includes(m.id))

    return true
}

module.exports = {
    name: 'messageUpdate',
    fn: execute
}