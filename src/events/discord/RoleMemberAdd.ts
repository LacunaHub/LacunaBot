import { Collection, GuildMember, Role } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { RoleMemberAdd } from '../../modules/Logs'

const handler = async (self: Lacuna, member: GuildMember, roles: Collection<string, Role>) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: member.guild.id })

    await RoleMemberAdd(self, server, member, roles)

    return true
}

export default {
    name: 'roleMemberAdd',
    handler
}
