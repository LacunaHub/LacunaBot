const { RoleMemberAdd } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').Role} role
 */
const execute = async (self, member, role) => {
    const server = await self.db.servers.fetch({ _id: member.guild.id })

    if (role.id == '746752483115794583' || (member.guild.id == '740586549145763960' && role.name == 'Server Booster')) {
        await self.db.users.fetch({ _id: member.id })

        await self.db.users.update({ _id: member.id }, {
            $set: {
                'boost.available': true,
                'boost.type': 'SERVER_BOOST',
                'boost.tier': 1
            }
        })
    }

    await RoleMemberAdd(self, server, member, role)

    return true
}

module.exports = {
    name: 'roleMemberAdd',
    fn: execute
}