import { Events, Guild } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import Logs from '../../modules/Logs'

const handler = async (self: Lacuna, before: Guild, guild: Guild) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: guild.id })

    await Logs.GuildUpdate(self, server, before, guild)

    return true
}

export default {
    name: Events.GuildUpdate,
    handler
}
