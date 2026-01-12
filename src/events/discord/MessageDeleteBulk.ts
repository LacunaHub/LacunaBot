import { ServerDocument } from '@/database/schemas/Servers'
import { Collection, Events, Message } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import Logs from '../../modules/Logs'

const handler = async (self: Lacuna, messages: Collection<string, Message>) => {
    messages = messages.filter(v => !v.partial)
    const message = messages.first()

    if (!message) return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: message.guildId })

    await Logs.MessageDeleteBulk(self, server, messages)

    return true
}

export default {
    name: Events.MessageBulkDelete,
    handler
}
