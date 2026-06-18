import { ServerModulesAutomationTriggers } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import Automation from '@/modules/custom-behavior/Automation.js'
import { GuildMember, Role } from 'discord.js'

const handler = async (self: Lacuna, member: GuildMember, _roles: Role[]) => {
    const server = await self.db.servers.fetch({ _id: member.guild.id })
    if (!server || server.blocked) return false

    await Automation.handleEvent(ServerModulesAutomationTriggers.RoleMemberAdd, self, server, member)

    return true
}

export default {
    name: 'guildMemberRoleAdd',
    handler
}
