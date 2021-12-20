import { GuildMember } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { nicknamesModeration } from '../../modules/Automoder'
import Greeting from '../../modules/Greeting'
import { GuildMemberUpdate } from '../../modules/Logs'

const handler = async (self: Lacuna, before: GuildMember, member: GuildMember) => {
    if (self.user.id == member.id) return false

    if (before.partial) {
        before = await before.fetch().catch(() => {}) as GuildMember
    }

    if (member.partial) {
        member = await member.fetch().catch(() => {}) as GuildMember
    }

    if (!before || !member) return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: member.guild.id })

    if (member.roles.cache.some(r => !before.roles.cache.has(r.id))) {
        const roles = member.roles.cache.filter(r => !before.roles.cache.has(r.id))

        self.emit('roleMemberAdd', member, roles)
    }
    
    if (before.roles.cache.some(r => !member.roles.cache.has(r.id))) {
        const roles = before.roles.cache.filter(r => !member.roles.cache.has(r.id))

        self.emit('roleMemberRemove', member, roles)
    }

    if (member.guild.features.includes('MEMBER_VERIFICATION_GATE_ENABLED') && before.pending && !member.pending) await Greeting(self, server, member)

    await GuildMemberUpdate(self, server, before, member)

    await nicknamesModeration(self, server, member)

    return true
}

export default {
    name: 'guildMemberUpdate',
    handler
}