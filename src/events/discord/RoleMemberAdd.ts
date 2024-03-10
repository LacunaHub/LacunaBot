import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { Collection, GuildMember, Role } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import Automation from '../../modules/Automation'
import Logs from '../../modules/Logs'

const handler = async (self: Lacuna, member: GuildMember, roles: Collection<string, Role>) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: member.guild.id })

    await Automation.handleEvent('ROLE_MEMBER_ADD', self, server, member)
    await Logs.RoleMemberAdd(self, server, member, roles)

    return true
}

export default {
    name: 'roleMemberAdd',
    handler
}
