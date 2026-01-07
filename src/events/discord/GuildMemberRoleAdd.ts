import { ServerDocument, ServerModulesAutomationTriggers } from '@/database/schemas/Servers'
import { GuildMember, Role } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import Automation from '../../modules/custom-behavior/Automation'

const handler = async (self: Lacuna, member: GuildMember, roles: Role[]) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: member.guild.id })
    if (!server || server.blocked) return false

    await Automation.handleEvent(ServerModulesAutomationTriggers.RoleMemberAdd, self, server, member)

    return true
}

export default {
    name: 'guildMemberRoleAdd',
    handler
}
