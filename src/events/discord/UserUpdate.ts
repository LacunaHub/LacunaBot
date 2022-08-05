import { User } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { UserUpdate } from '../../modules/Logs'

const handler = async (self: Lacuna, before: User, user: User) => {
    if (user.bot) return false

    const guilds = self.guilds.cache.filter(g => g.members.cache.has(user.id))

    if (guilds.size) {
        for (const [, guild] of guilds) {
            const server: ServerDocument = await self.db.servers.fetch({ _id: guild.id })

            await UserUpdate(self, server, guild, before, user)
        }
    }

    return true
}

export default {
    name: 'userUpdate',
    handler
}
