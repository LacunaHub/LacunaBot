import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { GuildMember, Role } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import Automation from '../../modules/Automation'

const handler = async (self: Lacuna, member: GuildMember, roles: Role[]) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: member.guild.id })
    if (!server || server.blocked) return false

    await Automation.handleEvent('ROLE_MEMBER_ADD', self, server, member)

    return true
}

export default {
    name: 'guildMemberRoleAdd',
    handler
}
