import { ServerModulesAutomationTriggers } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { activePatronRoleId, supportServerId } from '@/internals/utility/Constants.js'
import AutoMod from '@/modules/AutoMod/index.js'
import Automation from '@/modules/custom-behavior/Automation.js'
import Greeting from '@/modules/Greeting.js'
import GuildImageRotation from '@/modules/GuildImageRotation.js'
import Logs from '@/modules/Logs/index.js'
import Reports from '@/modules/Moderation/Reports.js'
import { Events, GuildMember } from 'discord.js'

const handler = async (self: Lacuna, member: GuildMember) => {
    const server = await self.db.servers.fetch({ _id: member.guild.id })

    await self.fetchGuild(member.guild)
    await Greeting.sendMessage(self, server, member)

    if (!member.guild.features.includes('MEMBER_VERIFICATION_GATE_ENABLED')) {
        await Greeting.addInitialRoles(self, server, member)
        await Greeting.restoreNicknameAndRoles(self, server, member)
    }

    await Automation.handleEvent(ServerModulesAutomationTriggers.GuildMemberAdd, self, server, member)
    await Reports.handleGuildMemberAdd(self, server, member)
    await AutoMod.moderateNicknames(self, server, member)
    await AutoMod.moderateNewbies(self, server, member)
    await GuildImageRotation.rotateBanner(self, server, member.guild, member)
    await Logs.GuildMemberAdd(self, server, member)

    if (member.guild.id === supportServerId) {
        const user = await self.db.users.findOne({ _id: member.id })

        if (user?.premium?.available) {
            await member.roles.add(activePatronRoleId)
        }
    }

    return true
}

export default {
    name: Events.GuildMemberAdd,
    handler
}
