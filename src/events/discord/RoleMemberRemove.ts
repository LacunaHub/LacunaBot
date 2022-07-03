import { Collection, GuildMember, Role } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import { RoleMemberRemove } from '../../modules/Logs'

const handler = async (self: Lacuna, member: GuildMember, roles: Collection<string, Role>) => {
    const server = await self.db.servers.fetch({ _id: member.guild.id })

    const temprole = self.temproles.find(i => i.user_id == member.id)

    if (temprole && roles.some(i => i.id == temprole.role_id)) await temprole.delete()

    await RoleMemberRemove(self, server, member, roles)

    return true
}

export default {
    name: 'roleMemberRemove',
    handler
}
