/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').Guild} guild
 */
const handler = async (self, guild) => {
    const server = await self.db.servers.fetch({ _id: guild.id })

    await self.logger.info(`${self.user.username}#${guild.shardId} added to guild ${guild.name} (${guild.id}) (${guild.memberCount})`)
    await self.logger.telegram.info(`${self.user.username}#${guild.shardId} added to guild ${guild.name} (${guild.id}) (${guild.memberCount})`)

    if (server.server.blocked) {
        await self.logger.info(`Guild ${guild.name} (${guild.id}) is blocked`)
        
        await guild.leave()

        return false
    }

    try {
        await self.registerSlashCommands(guild.id, server.locale)

        await self.db.servers.update({ _id: guild.id }, { $set: { 'commands.slash_commands': true } })
    } catch (err) {
        if (server.commands.slash_commands) await self.db.servers.update({ _id: guild.id }, { $set: { 'commands.slash_commands': false } })
    }

    return true
}

module.exports = {
    name: 'guildCreate',
    handler
}