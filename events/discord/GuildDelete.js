/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').Guild} guild
 */
const handler = async (self, guild) => {
    await self.logger.info(`${self.user.username} removed from guild ${guild.name} (${guild.id}) (${guild.members.cache.filter(m => !m.user.bot).size}/${guild.memberCount})`)
    await self.logger.telegram.info(`${self.user.username} removed from guild ${guild.name} (${guild.id}) (${guild.members.cache.filter(m => !m.user.bot).size}/${guild.memberCount})`)

    const server = await self.db.servers.find({ _id: guild.id })

    if (server?.commands?.slash_commands) await self.db.servers.update({ _id: guild.id }, { $set: { 'commands.slash_commands': false } })

    await self.guilds.cache.delete(guild.id)

    return true
}

module.exports = {
    name: 'guildDelete',
    handler
}