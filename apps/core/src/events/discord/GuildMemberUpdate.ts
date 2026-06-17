import Lacuna from '@/internals/Lacuna.js'
import AutoMod from '@/modules/AutoMod/index.js'
import Greeting from '@/modules/Greeting.js'
import { Events, GuildMember } from 'discord.js'

const handler = async (self: Lacuna, before: GuildMember, member: GuildMember) => {
    if (self.user!.id === member.id) return false
    if (!before || !member) return false

    const server = await self.db.servers.fetch({ _id: member.guild.id })

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
