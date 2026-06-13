import { ServerDocument } from '@/database/schemas/Servers'
import { Events, GuildMember } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import AutoMod from '../../modules/AutoMod'
import Greeting from '../../modules/Greeting'

const handler = async (self: Lacuna, before: GuildMember, member: GuildMember) => {
    if (self.user.id === member.id) return false
    if (!before || !member) return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: member.guild.id })

    if (member.guild.features.includes('MEMBER_VERIFICATION_GATE_ENABLED') && before.pending && !member.pending) {
        await Greeting.addInitialRoles(self, server, member)
        await Greeting.restoreNicknameAndRoles(self, server, member)
    }

    await AutoMod.moderateNicknames(self, server, member)

    return true
}

export default {
    name: Events.GuildMemberUpdate,
    handler
}
