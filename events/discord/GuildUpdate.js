const GuildUpdate = require('../../modules/Logs/Guild/GuildUpdate')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').Guild} before
 * @param {import('discord.js').Guild} guild
 */
const execute = async (self, before, guild) => {
    const server = await self.db.servers.fetch({ _id: guild.id })

    await GuildUpdate(self, server, before, guild)

    return true
}

module.exports = {
    name: 'guildUpdate',
    fn: execute
}