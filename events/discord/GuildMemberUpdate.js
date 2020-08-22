const { GuildMemberUpdate } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').GuildMember} before
 * @param {import('discord.js').GuildMember} member
 */
const execute = async (self, before, member) => {
    if (self.user.id == member.id) return false

    const server = await self.db.servers.fetch({ _id: member.guild.id })

    if (before.roles.cache.size < member.roles.cache.size) {
        const role = member.roles.cache.find(r => !before.roles.cache.has(r.id))

        await self.emit('roleMemberAdd', member, role)
    }
    
    if (before.roles.cache.size > member.roles.cache.size) {
        const role = before.roles.cache.find(r => !member.roles.cache.has(r.id))

        await self.emit('roleMemberRemove', member, role)
    }

    await GuildMemberUpdate(self, server, before, member)

    return true
}

module.exports = {
    name: 'guildMemberUpdate',
    fn: execute
}