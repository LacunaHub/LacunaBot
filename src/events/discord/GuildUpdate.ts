import { Guild } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { GuildUpdate } from '../../modules/Logs'

const handler = async (self: Lacuna, before: Guild, guild: Guild) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: guild.id })

    await GuildUpdate(self, server, before, guild)

    return true
}

export default {
    name: 'guildUpdate',
    handler
}