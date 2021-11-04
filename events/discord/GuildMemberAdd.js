const Automoder = require('../../modules/Automoder')
const Greeting = require('../../modules/Greeting')
const GuildMemberAdd = require('../../modules/Logs/Guild/GuildMemberAdd')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').GuildMember} member
 */
const handler = async (self, member) => {
    if (member.partial) {
        member = await member.fetch()
    }

    const server = await self.db.servers.fetch({ _id: member.guild.id })

    if (!member.guild.features.includes('MEMBER_VERIFICATION_GATE_ENABLED')) await Greeting.Handle(self, server, member)

    await GuildMemberAdd(self, server, member)
    await Automoder.updateNickname(self, server, member)
    await Automoder.validateNewbie(self, server, member)

    return true
}

module.exports = {
    name: 'guildMemberAdd',
    handler
}