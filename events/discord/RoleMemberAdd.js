const { RoleMemberAdd } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').Role} role
 */
const execute = async (self, member, role) => {
    const server = await self.db.servers.fetch({ _id: member.guild.id })

    if (member.guild.id == '740586549145763960' && ['746826292900528311', '746825558205136926', '746752483115794583'].includes(role.id)) {
        const user = await self.db.users.fetch({ _id: member.id })

        if (role.id == '746826292900528311') {
            await self.db.users.update({ _id: member.id }, {
                $set: {
                    flags: user.flags | 1 << 0,
                    'boost.available': true,
                    'boost.type': 'DEVELOPER',
                    'boost.tier': 100
                }
            })
        }

        if (role.id == '746825558205136926') {
            await self.db.users.update({ _id: member.id }, {
                $set: {
                    flags: user.flags | 1 << 1,
                    'boost.available': true,
                    'boost.type': 'TEAM',
                    'boost.tier': user.boost.tier || 2
                }
            })
        }

        if (role.id == '746752483115794583' && !user.boost.available) {
            await self.db.users.update({ _id: member.id }, {
                $set: {
                    'boost.available': true,
                    'boost.type': 'SERVER_BOOST',
                    'boost.tier': 1
                }
            })
        }
    }

    await RoleMemberAdd(self, server, member, role)

    return true
}

module.exports = {
    name: 'roleMemberAdd',
    fn: execute
}