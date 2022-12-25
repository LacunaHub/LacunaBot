import { Events, Guild } from 'discord.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, guild: Guild) => {
    self.logger.info(`${self.user.username} removed from guild ${guild.name} (${guild.id}) with ${guild.memberCount} members`)
    await self.logger.telegram.info(`${self.user.username} removed from guild ${guild.name} (${guild.id}) with ${guild.memberCount} members`)

    const player = self.player.get(guild.id)

    if (player) player.destroy()

    self.guilds.cache.delete(guild.id)

    return true
}

export default {
    name: Events.GuildDelete,
    handler
}
