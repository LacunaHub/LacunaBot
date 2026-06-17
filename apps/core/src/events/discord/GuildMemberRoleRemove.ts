import { ServerModulesAutomationTriggers } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import Automation from '@/modules/custom-behavior/Automation.js'
import { GuildMember, Role } from 'discord.js'

const handler = async (self: Lacuna, member: GuildMember, roles: Role[]) => {
    const server = await self.db.servers.fetch({ _id: member.guild.id })
    if (!server || server.blocked) return false

    await Automation.handleEvent(ServerModulesAutomationTriggers.RoleMemberRemove, self, server, member)

    const temprole = self.temproles.find(i => i.user_id === member.id)
    if (temprole && roles.some(i => i.id === temprole.role_id)) {
        await temprole.delete()
    }

    return true
}

export default {
    name: 'guildMemberRoleRemove',
    handler
}
