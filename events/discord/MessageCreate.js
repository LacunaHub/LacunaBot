const help = require('../../commands/general/help')
const { Text } = require('../../modules/Levels')
const Automoder = require('../../modules/Automoder')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').Message} message
 */
const execute = async (self, message) => {
    if (message.author.bot || message.channel.type == 'dm') return null

    const server = await self.db.servers.fetch({ _id: message.guild.id })

    if (message.member.roles.cache.has(server.moderation.roles.mute) && !message.member.hasPermission('MANAGE_MESSAGES')) {
        const mute_role = message.guild.roles.cache.get(server.moderation.roles.mute)
        const has_permissions = message.channel.permissionsFor(mute_role.id).has('SEND_MESSAGES')

        if (message.deletable && !message.deleted && !has_permissions) await message.delete()

        return false
    }

    const splitted = message.content.split(' ')
    const command_name = splitted[0].toLowerCase()
    const args = splitted.slice(1).filter(arg => arg)

    const command = self.commands.get(command_name.slice(server.prefix.length)) || self.commands.find(c => c.aliases && c.aliases.includes(command_name.slice(server.prefix.length)))

    if (command) {
        await command.execute(server, message, args)
    }

    if (message.mentions.has(self.user.id)) {
        const mentioned = message.content.trim().startsWith(`<@${self.user.id}>`) || message.content.trim().length == `<@${self.user.id}>`.length
        const mentioned_with_exclamation = message.content.trim().startsWith(`<@!${self.user.id}>`) || message.content.trim().length == `<@!${self.user.id}>`.length

        if (mentioned || mentioned_with_exclamation) await help.fn(self, server, message, args)
    }

    await Text(self, server, message)

    await Automoder.linksFilter(self, server, message)
    await Automoder.swearFilter(self, server, message)
    await Automoder.slowdownUser(self, server, message)
    await Automoder.antiCaps(self, server, message)

    return true
}

module.exports = {
    name: 'message',
    fn: execute
}