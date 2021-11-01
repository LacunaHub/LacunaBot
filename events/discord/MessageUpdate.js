const { parseCommandArguments } = require('../../internals/utility/Utils')
const Automoder = require('../../modules/Automoder')
const CustomCommand = require('../../modules/CustomCommand')
const MessageUpdate = require('../../modules/Logs/Message/MessageUpdate')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').Message} before
 * @param {import('discord.js').Message} message
 */
const handler = async (self, before, message) => {
    let partial = before.partial || message.partial

    before = before.partial ? (await before.fetch()) : before
    message = message.partial ? (await message.fetch()) : message

    if (message.author.bot || message.channel.type == 'DM') return false
    if ((!before.embeds.length && message.embeds.length) || (!before.pinned && message.pinned)) return false

    const server = await self.db.servers.fetch({ _id: message.guild.id })

    const splitted = message.content.split(/\s+/)
    const command_name = splitted.shift().toLowerCase()
    message.args = parseCommandArguments(splitted.join(' '))

    const command = self.commands.find(c => c.name == command_name.slice(server.prefix.length) && c.is_prefix_command)
    const custom_command = server.commands.custom.find(c => !c.inactive && c.name == command_name.slice(server.prefix.length))

    if (command && (!server.commands.slash_commands || command.private)) {
        await command.executePrefix(server, message)
    }

    if (custom_command && !command) {
        const custom = new CustomCommand(custom_command, self, server, message)

        await custom.execute()
    }

    await Automoder.linksFilter(self, server, message)
    await Automoder.swearFilter(self, server, message)
    await Automoder.antiCaps(self, server, message)

    await MessageUpdate(self, server, before, message)

    if (partial) await message.channel.messages.cache.sweep(m => [before.id, message.id].includes(m.id))

    return true
}

module.exports = {
    name: 'messageUpdate',
    handler
}