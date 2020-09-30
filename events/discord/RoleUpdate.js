const { RoleUpdate } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').Role} before
 * @param {import('discord.js').Role} role
 */
const execute = async (self, before, role) => {
    const server = await self.db.servers.find({ _id: role.guild.id })

    if (!server) return false

    await RoleUpdate(self, server, before, invite)

    return true
}

module.exports = {
    name: 'roleUpdate',
    fn: execute
}