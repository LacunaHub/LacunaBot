import { Message } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { antiCaps, linksFilter, swearFilter } from '../../modules/Automoder'
import { MessageUpdate } from '../../modules/Logs'

const handler = async (self: Lacuna, before: Message, message: Message) => {
    let partial = before.partial || message.partial

    before = before.partial ? await before.fetch() : before
    message = message.partial ? await message.fetch() : message

    if (message.author.bot || message.channel.type == 'DM') return false
    if ((!before.embeds.length && message.embeds.length) || (!before.pinned && message.pinned)) return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: message.guild.id })

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
