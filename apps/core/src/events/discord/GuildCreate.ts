import Lacuna from '@/internals/Lacuna.js'
import { Events, Guild } from 'discord.js'

const handler = async (self: Lacuna, guild: Guild) => {
    const preferredLocale = guild.preferredLocale?.split('-')?.[0]!
    const server = await self.db.servers.fetch(
        { _id: guild.id },
        { locale: self.i18n.isSupported(preferredLocale) as any }
    )

    self.logger.info({ guildId: guild.id, memberCount: guild.memberCount }, 'added to guild')

    if (server.blocked) {
        self.logger.info({ guildId: guild.id }, 'leaving the guild due to a block')

        await guild.leave()

        return false
    }

    try {
        await self.updateApplicationCommands(server)
    } catch (err) {
        self.logger.error({ module: 'GuildCreate', action: 'UpdateApplicationCommands', err, guildId: guild.id })
    }

    return true
}

export default {
    name: Events.GuildCreate,
    handler
}
