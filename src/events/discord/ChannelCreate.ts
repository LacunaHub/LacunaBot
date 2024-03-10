import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { Events, GuildChannel } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import Logs from '../../modules/Logs'

const handler = async (self: Lacuna, channel: GuildChannel) => {
    const server: ServerDocument = await self.db.servers.findOne({ _id: channel.guild.id })

    if (!server) return false

    await Logs.ChannelCreate(self, server, channel)

    return true
}

export default {
    name: Events.ChannelCreate,
    handler
}
