const Farewell = require('../../modules/Farewell')
const { GuildMemberRemove } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').GuildMember} member
 */
const execute = async (self, member) => {
    if (member.partial) {
        member = await member.guild.members.fetch({ member: member.id, cache: false })
    }

    if (!member || !member.guild) return false

    const server = await self.db.servers.fetch({ _id: member.guild.id })

    await Farewell.Handle(self, server, member)

    await GuildMemberRemove(self, server, member)

    return true
}

module.exports = {
    name: 'guildMemberRemove',
    fn: execute
}