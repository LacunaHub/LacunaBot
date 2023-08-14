import { Events, GuildChannel } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
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
