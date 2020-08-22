const { RoleMemberRemove } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').Role} role
 */
const execute = async (self, member, role) => {
    const server = await self.db.servers.fetch({ _id: member.guild.id })

    if (role.id == '746752483115794583' || (member.guild.id == '740586549145763960' && role.name == 'Server Booster')) {
        const user = await self.db.users.find({ _id: member.id })

        await self.db.users.update({ _id: member.id }, {
            $set: {
                'boost.available': false,
                'boost.type': 'NONE',
                'boost.tier': 0,
                'boost.guilds': []
            }
        })

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