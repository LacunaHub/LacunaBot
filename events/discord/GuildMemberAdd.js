const Automoder = require('../../modules/Automoder')
const Greeting = require('../../modules/Greeting')
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

    await Greeting.Handle(self, server, member)

    await GuildMemberAdd(self, server, member)
    await Automoder.updateNickname(self, server, member)

    return true
}

module.exports = {
    name: 'guildMemberAdd',
    fn: execute
}