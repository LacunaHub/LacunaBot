import { Guild } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, guild: Guild) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: guild.id })

    self.logger.info(`${self.user.username}#${guild.shardId} added to guild ${guild.name} (${guild.id}) with ${guild.memberCount} members`)
    await self.logger.telegram.info(`${self.user.username}#${guild.shardId} added to guild ${guild.name} (${guild.id}) with ${guild.memberCount} members`)

    if (server.server.blocked) {
        self.logger.info(`Guild ${guild.name} (${guild.id}) is blocked`)

        await guild.leave()

        return false
    }

    try {
        await self.updateApplicationCommands(server)
    } catch (err) {}

    return true
}

export default {
    name: 'guildCreate',
    handler
}
