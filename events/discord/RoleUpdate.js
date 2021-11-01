const RoleUpdate = require('../../modules/Logs/Role/RoleUpdate')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').Role} before
 * @param {import('discord.js').Role} role
 */
const handler = async (self, before, role) => {
    if (before.position != role.position) return false

    const server = await self.db.servers.find({ _id: role.guild.id })

    if (!server) return false

    await RoleUpdate(self, server, before, role)

    return true
}

module.exports = {
    name: 'roleUpdate',
    handler
}