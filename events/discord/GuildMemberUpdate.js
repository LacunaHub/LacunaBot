const Automoder = require('../../modules/Automoder')
const GuildMemberUpdate = require('../../modules/Logs/Guild/GuildMemberUpdate')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').GuildMember} before
 * @param {import('discord.js').GuildMember} member
 */
const execute = async (self, before, member) => {
    if (self.user.id == member.id) return false

    if (before.partial) {
        before = await before.fetch()
    }

    if (member.partial) {
        member = await member.fetch()
    }

    const server = await self.db.servers.fetch({ _id: member.guild.id })

    if (member.roles.cache.some(r => !before.roles.cache.has(r.id))) {
        const roles = member.roles.cache.filter(r => !before.roles.cache.has(r.id))

        await self.emit('roleMemberAdd', member, roles)
    }
    
    if (before.roles.cache.some(r => !member.roles.cache.has(r.id))) {
        const roles = before.roles.cache.filter(r => !member.roles.cache.has(r.id))

        await self.emit('roleMemberRemove', member, roles)
    }

    await GuildMemberUpdate(self, server, before, member)

    await Automoder.updateNickname(self, server, member)

    return true
}

module.exports = {
    name: 'guildMemberUpdate',
    fn: execute
}