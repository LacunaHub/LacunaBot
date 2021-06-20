const RoleDelete = require('../../modules/Logs/Role/RoleDelete')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').Role} role
 */
const execute = async (self, role) => {
    const server = await self.db.servers.find({ _id: role.guild.id })

    if (!server) return false

    await RoleDelete(self, server, role)

    return true
}

module.exports = {
    name: 'roleDelete',
    fn: execute
}