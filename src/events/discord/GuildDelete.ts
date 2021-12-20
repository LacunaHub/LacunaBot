import { Guild } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, guild: Guild) => {
    self.logger.info(`${self.user.username} removed from guild ${guild.name} (${guild.id}) with ${guild.memberCount} members`)
    await self.logger.telegram.info(`${self.user.username} removed from guild ${guild.name} (${guild.id}) with ${guild.memberCount} members`)

    const server: ServerDocument = await self.db.servers.findOne({ _id: guild.id })

    if (server?.commands?.slash_commands) await self.db.servers.updateOne({ _id: guild.id }, { $set: { 'commands.slash_commands': false } })

    self.guilds.cache.delete(guild.id)

    return true
}

export default {
    name: 'guildDelete',
    handler
}