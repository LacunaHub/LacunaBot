/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').Guild} guild
 */
const execute = async (self, guild) => {
    const server = await self.db.servers.fetch({ _id: guild.id })

    await self.logger.info(`${self.user.username} added to guild ${guild.name} (${guild.id}) (${guild.members.cache.filter(m => !m.user.bot).size}/${guild.memberCount})`)
    await self.logger.telegram.info(`${self.user.username} added to guild ${guild.name} (${guild.id}) (${guild.members.cache.filter(m => !m.user.bot).size}/${guild.memberCount})`)

    if (server.server.blocked) {
        await self.logger.info(`Guild ${guild.name} is blocked. ${self.user.username} leave the guild`)
        
        await guild.leave()

        return false
    }

    return true
}

module.exports = {
    name: 'guildCreate',
    fn: execute
}