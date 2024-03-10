import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { Events, ThreadChannel } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import Logs from '../../modules/Logs'

const handler = async (self: Lacuna, thread: ThreadChannel) => {
    const server: ServerDocument = await self.db.servers.findOne({ _id: thread.guild.id })

    if (!server) return false

    await Logs.ThreadDelete(self, server, thread)

    return true
}

export default {
    name: Events.ThreadDelete,
    handler
}
