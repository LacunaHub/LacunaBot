import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { Collection, Events, Message } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import Logs from '../../modules/Logs'

const handler = async (self: Lacuna, messages: Collection<string, Message>) => {
    const message = messages.first()

    const server: ServerDocument = await self.db.servers.fetch({ _id: message.guild.id })

    await Logs.MessageDeleteBulk(self, server, messages)

    return true
}

export default {
    name: Events.MessageBulkDelete,
    handler
}
