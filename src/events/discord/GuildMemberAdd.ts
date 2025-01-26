import { ServerDocument, ServerModulesAutomationTriggers } from '@lacunahub/lacuna-database-driver'
import { Events, GuildMember } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import { activePatronRoleId, supportServerId } from '../../internals/utility/Constants'
import AutoMod from '../../modules/AutoMod'
import Automation from '../../modules/custom-behavior/Automation'
import Greeting from '../../modules/Greeting'
import GuildImageRotation from '../../modules/GuildImageRotation'
import Logs from '../../modules/Logs'
import Reports from '../../modules/Moderation/Reports'

const handler = async (self: Lacuna, member: GuildMember) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: member.guild.id })

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
