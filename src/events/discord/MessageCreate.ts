import { messageCreate as addLevelPoints } from '../../modules/Levels'
import { messageCreate as addWalletCash } from '../../modules/Economy'
import { autoReact } from '../../modules/Reactions'
import CustomCommand from '../../modules/CustomCommand'
import { parseCommandArguments } from '../../internals/utility/Utils'
import Lacuna from '../../internals/Lacuna'
import { Message } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import { antiCaps, linksFilter, nicknamesModeration, swearFilter, usersSlowdown } from '../../modules/Automoder'

const handler = async (self: Lacuna, message: Message) => {
    if (message.author.bot || message.channel.type == 'DM') return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: message.guild.id })

    if (server.server.blocked) {
        await message.guild.leave()

        return false
    }
    
    await message.member.fetch()

    if (message.member && message.member.roles.cache.has(server.moderation.roles.mute) && !message.member.permissions.has(self.PERMISSIONS_FLAGS.MANAGE_MESSAGES)) {
        const mute_role = message.guild.roles.cache.get(server.moderation.roles.mute)
        const has_permissions = message.channel.permissionsFor(mute_role.id).has(self.PERMISSIONS_FLAGS.SEND_MESSAGES)

        if (message.deletable && !has_permissions) await message.delete()

        return false
    }

    const splitted = message.content.split(/\s+/)
    const command_name = splitted.shift().toLowerCase()
    message['args'] = parseCommandArguments(splitted.join(' '))

    const command = self.commands.find(c => c.name == command_name.slice(server.prefix.length) && c.is_prefix_command)
    const custom_command = server.commands.custom.find(c => !c.inactive && c.name == command_name.slice(server.prefix.length))

    if (command) {
        await command.executePrefix(server, message)
    }

    if (custom_command && !command) {
        const custom = new CustomCommand(custom_command, self, server, message)

        await custom.execute()
    }

    if (!command && !custom_command && ['DEFAULT', 'REPLY'].includes(message.type)) {
        await addLevelPoints(self, server, message)
        await addWalletCash(self, server, message)
    }

    await antiCaps(self, server, message)
    await linksFilter(self, server, message)
    await nicknamesModeration(self, server, message.member)
    await swearFilter(self, server, message)
    await usersSlowdown(self, server, message)

    await autoReact(server, message)

    return true
}

export default {
    name: 'messageCreate',
    handler
}