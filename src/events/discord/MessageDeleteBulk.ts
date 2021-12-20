import { Collection, Message } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { MessageDeleteBulk } from '../../modules/Logs'

const handler = async (self: Lacuna, messages: Collection<string, Message>) => {
    const message = messages.first()

    const server: ServerDocument = await self.db.servers.fetch({ _id: message.guild.id })

    await MessageDeleteBulk(self, server, messages)

    return true
}

export default {
    name: 'messageDeleteBulk',
    handler
}