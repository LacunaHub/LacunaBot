import { Events, Guild } from 'discord.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, guild: Guild) => {
    self.logger.info({ guildId: guild.id, memberCount: guild.memberCount }, 'removed from guild')

    const player = self.lava.nodes.getPlayer(guild.id)

    player && (await player.destroy())
    self.guilds.cache.delete(guild.id)

    return true
}

export default {
    name: Events.GuildDelete,
    handler
}
