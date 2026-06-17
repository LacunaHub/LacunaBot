import Lacuna from '@/internals/Lacuna.js'
import Logs from '@/modules/Logs/index.js'
import { Events, User } from 'discord.js'

const handler = async (self: Lacuna, before: User, user: User) => {
    if (user.bot) return false

    const guilds = self.guilds.cache.filter(g => g.members.cache.has(user.id))

    for (const [, guild] of guilds) {
        const server = await self.db.servers.fetch({ _id: guild.id })

        await Logs.UserUpdate(self, server, guild as any, before, user)
    }

    return true
}

export default {
    name: Events.UserUpdate,
    handler
}
