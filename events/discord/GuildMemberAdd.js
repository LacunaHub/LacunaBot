const Welcome = require('../../modules/Welcome')
const { GuildMemberAdd } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').GuildMember} member
 */
const execute = async (self, member) => {
    if (member.partial) {
        member = await member.guild.members.fetch({ member: member, cache: false })
    }

    const server = await self.db.servers.fetch({ _id: member.guild.id })

    await Welcome.Handle(self, server, member)

    await GuildMemberAdd(self, server, member)

    return true
}

module.exports = {
    name: 'guildMemberAdd',
    fn: execute
}