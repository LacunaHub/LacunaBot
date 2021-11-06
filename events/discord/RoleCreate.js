const { RoleCreate } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').Role} role
 */
const handler = async (self, role) => {
    const server = await self.db.servers.find({ _id: role.guild.id })

    if (!server) return false

    await RoleCreate(self, server, role)

    return true
}

module.exports = {
    name: 'roleCreate',
    handler
}