import { ThreadChannel } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { ThreadDelete } from '../../modules/Logs'

const handler = async (self: Lacuna, thread: ThreadChannel) => {
    const server: ServerDocument = await self.db.servers.findOne({ _id: thread.guild.id })

    if (!server) return false

    await ThreadDelete(self, server, thread)

    return true
}

export default {
    name: 'threadDelete',
    handler
}