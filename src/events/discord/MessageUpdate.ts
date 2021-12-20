import { Message } from 'discord.js'
import { ServerDocument, CustomCommand as ICustomCommand } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import Command from '../../internals/structures/Command'
import { parseCommandArguments } from '../../internals/utility/Utils'
import { antiCaps, linksFilter, swearFilter } from '../../modules/Automoder'
import CustomCommand from '../../modules/CustomCommand'
import { MessageUpdate } from '../../modules/Logs'

const handler = async (self: Lacuna, before: Message, message: Message) => {
    let partial = before.partial || message.partial

    before = before.partial ? (await before.fetch()) : before
    message = message.partial ? (await message.fetch()) : message

    if (message.author.bot || message.channel.type == 'DM') return false
    if ((!before.embeds.length && message.embeds.length) || (!before.pinned && message.pinned)) return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: message.guild.id })

    const splitted = message.content.split(/\s+/)
    const command_name = splitted.shift().toLowerCase()
    message['args'] = parseCommandArguments(splitted.join(' '))

    const command: Command = self.commands.find(c => c.name == command_name.slice(server.prefix.length) && c.is_prefix_command)
    const custom_command: ICustomCommand = server.commands.custom.find(c => !c.inactive && c.name == command_name.slice(server.prefix.length))

    if (command) {
        await command.executePrefix(server, message)
    }

    if (custom_command && !command) {
        const custom: CustomCommand = new CustomCommand(custom_command, self, server, message)

        await custom.execute()
    }

    await antiCaps(self, server, message)
    await linksFilter(self, server, message)
    await swearFilter(self, server, message)

    await MessageUpdate(self, server, before, message)

    if (partial) message.channel.messages.cache.sweep(m => [before.id, message.id].includes(m.id))

    return true
}

export default {
    name: 'messageUpdate',
    handler
}