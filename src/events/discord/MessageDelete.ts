import { Message } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { MessageDelete } from '../../modules/Logs'

const handler = async (self: Lacuna, message: Message) => {
    if (message.partial || message.author.bot || message.channel.type == 'DM') return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: message.guild.id })

    await MessageDelete(self, server, message)

    return true
}

export default {
    name: 'messageDelete',
    handler
}