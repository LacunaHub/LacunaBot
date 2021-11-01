const { messageCreate } = require('../../modules/Levels')
const Automoder = require('../../modules/Automoder')
const { autoReact } = require('../../modules/Reactions')
const CustomCommand = require('../../modules/CustomCommand')
const { parseCommandArguments } = require('../../internals/utility/Utils')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').Message} message
 */
const handler = async (self, message) => {
    if (message.author.bot || message.channel.type == 'DM') return false

    const server = await self.db.servers.fetch({ _id: message.guild.id })

    if (server.server.blocked) {
        await message.guild.leave()

        return false
    }

    if (message.member && message.member.roles.cache.has(server.moderation.roles.mute) && !message.member.permissions.has(self.PERMISSIONS_FLAGS.MANAGE_MESSAGES)) {
        const mute_role = message.guild.roles.cache.get(server.moderation.roles.mute)
        const has_permissions = message.channel.permissionsFor(mute_role.id).has(self.PERMISSIONS_FLAGS.SEND_MESSAGES)

        if (message.deletable && !message.deleted && !has_permissions) await message.delete()

        return false
    }

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

    if (!command && !custom_command) await messageCreate(self, server, message)

    await Automoder.linksFilter(self, server, message)
    await Automoder.swearFilter(self, server, message)
    await Automoder.slowdownUser(self, server, message)
    await Automoder.antiCaps(self, server, message)
    await Automoder.updateNickname(self, server, message.member)

    await autoReact(server, message)

    return true
}

module.exports = {
    name: 'messageCreate',
    handler
}