import { ThreadChannel } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { ThreadUpdate } from '../../modules/Logs'

const handler = async (self: Lacuna, before: ThreadChannel, thread: ThreadChannel) => {
    const server: ServerDocument = await self.db.servers.findOne({ _id: thread.guild.id })

    if (!server) return false

    await ThreadUpdate(self, server, before, thread)

    return true
}

export default {
    name: 'threadUpdate',
    handler
}