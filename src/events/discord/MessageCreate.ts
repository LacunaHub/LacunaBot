import { Message } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { parseCommandArguments } from '../../internals/utility/Utils'
import { antiCaps, linksFilter, nicknamesModeration, swearFilter, usersSlowdown } from '../../modules/Automoder'
import { messageCreate as addWalletCash } from '../../modules/Economy'
import { messageCreate as addLevelPoints } from '../../modules/Levels'
import { autoReact } from '../../modules/Reactions'

const handler = async (self: Lacuna, message: Message) => {
    if (message.author.bot || message.channel.type == 'DM') return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: message.guild.id })

    if (server.server.blocked) {
        await message.guild.leave()

        return false
    }

    await message.member.fetch()

    const splitted = message.content.split(/\s+/)
    const command_name = splitted.shift().toLowerCase()
    message['args'] = parseCommandArguments(splitted.join(' '))

    const command = self.commands.find(c => c.name == command_name.slice(server.prefix.length) && c.is_prefix_command)

    if (command) {
        await command.executePrefix(server, message)
    }

    if (!command && ['DEFAULT', 'REPLY'].includes(message.type)) {
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
