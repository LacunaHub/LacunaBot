/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').Guild} guild
 */
const execute = async (self, guild) => {
    await self.logger.info(`${self.user.username} removed from guild ${guild.name} (${guild.id}) (${guild.members.cache.filter(m => !m.user.bot).size}/${guild.memberCount})`)
    await self.logger.telegram.info(`${self.user.username} removed from guild ${guild.name} (${guild.id}) (${guild.members.cache.filter(m => !m.user.bot).size}/${guild.memberCount})`)

    await self.guilds.cache.delete(guild.id)

    return true
}

module.exports = {
    name: 'guildDelete',
    fn: execute
}