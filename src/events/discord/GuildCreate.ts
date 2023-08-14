import { Events, Guild } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, guild: Guild) => {
    const preferredLocale = guild.preferredLocale?.split('-')?.[0]
    const server: ServerDocument = await self.db.servers.fetch({ _id: guild.id }, { locale: self.i18n.isSupported(preferredLocale) as string })

    self.logger.info(`${self.user.username}#${guild.shardId} added to guild ${guild.name} (${guild.id}) with ${guild.memberCount} members`)
    await self.logger.telegram.info(
        `${self.user.username}#${guild.shardId} added to guild ${guild.name} (${guild.id}) with ${guild.memberCount} members`
    )

    if (server.server.blocked) {
        self.logger.info(`Guild ${guild.name} (${guild.id}) is blocked`)

        await guild.leave()

        return false
    }

    try {
        await self.updateApplicationCommands(server)
    } catch (err) {
        self.logger.handleError({ module: 'GuildCreate', action: 'UpdateApplicationCommands', error: err, guild_id: guild.id })
    }

    return true
}

export default {
    name: Events.GuildCreate,
    handler
}
