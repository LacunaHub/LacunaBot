const { RoleMemberRemove } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').Role} role
 */
const execute = async (self, member, role) => {
    const server = await self.db.servers.fetch({ _id: member.guild.id })

    if (member.guild.id == '740586549145763960' && ['746826292900528311', '746825558205136926', '746752483115794583'].includes(role.id)) {
        const user = await self.db.users.find({ _id: member.id })

        if (role.id == '746826292900528311') {
            await self.db.users.update({ _id: member.id }, {
                $set: {
                    flags: user.flags ? user.flags ^ 1 << 0 : user.flags,
                    'boost.available': false,
                    'boost.type': 'NONE',
                    'boost.tier': 0,
                    'boost.guilds': []
                }
            })
        }

        if (role.id == '746825558205136926') {
            await self.db.users.update({ _id: member.id }, {
                $set: {
                    flags: user.flags ? user.flags ^ 1 << 1 : user.flags,
                    'boost.available': false,
                    'boost.type': 'NONE',
                    'boost.tier': 0,
                    'boost.guilds': []
                }
            })
        }

        if (role.id == '746752483115794583') {
            await self.db.users.update({ _id: member.id }, {
                $set: {
                    'boost.available': false,
                    'boost.type': 'NONE',
                    'boost.tier': 0,
                    'boost.guilds': []
                }
            })
        }

        if (user && user.boost.guilds.length) {
            for (const guild of user.boost.guilds) {
                const boosted = await self.db.servers.fetch({ _id: guild.id })

                if (!boosted.server.premium.will_expire_on) {
                    await self.db.servers.update({ _id: guild.id }, {
                        $set: {
                            'server.premium.available': false
                        }
                    })
                }
            }
        }
    }

    await RoleMemberRemove(self, server, member, role)

    return true
}

module.exports = {
    name: 'roleMemberRemove',
    fn: execute
}