import { ServerDocument } from '@/database/schemas/Servers'
import { Events, User } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import Logs from '../../modules/Logs'

const handler = async (self: Lacuna, before: User, user: User) => {
    if (user.bot) return false

    const guilds = self.guilds.cache.filter(g => g.members.cache.has(user.id))

    for (const [, guild] of guilds) {
        const server: ServerDocument = await self.db.servers.fetch({ _id: guild.id })

        await Logs.UserUpdate(self, server, guild, before, user)
    }

    return true
}

export default {
    name: Events.UserUpdate,
    handler
}
