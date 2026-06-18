import Lacuna from '@/internals/Lacuna.js'
import Logs from '@/modules/Logs/index.js'
import { Collection, Events, Message } from 'discord.js'

const handler = async (self: Lacuna, messages: Collection<string, Message>) => {
    messages = messages.filter(v => !v.partial)
    const message = messages.first()

    if (!message) return false

    const server = await self.db.servers.fetch({ _id: message.guildId! })

    await Logs.MessageDeleteBulk(self, server, messages as any)

    return true
}

export default {
    name: Events.MessageBulkDelete,
    handler
}
