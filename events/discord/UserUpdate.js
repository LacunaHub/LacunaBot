const UserUpdate = require('../../modules/Logs/User/UserUpdate')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').User} before
 * @param {import('discord.js').User} user
 */
const execute = async (self, before, user) => {
    if (user.bot) return false

    const guilds = self.guilds.cache.filter(g => g.members.cache.has(user.id))

    if (guilds.size) {
        for (const [, guild] of guilds) {
            const server = await self.db.servers.fetch({ _id: guild.id })

            await UserUpdate(self, server, guild, before, user)
        }
    }

    return true
}

module.exports = {
    name: 'userUpdate',
    fn: execute
}