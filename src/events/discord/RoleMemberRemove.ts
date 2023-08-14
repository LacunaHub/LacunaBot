import { Collection, GuildMember, Role } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import Automation from '../../modules/Automation'
import Logs from '../../modules/Logs'

const handler = async (self: Lacuna, member: GuildMember, roles: Collection<string, Role>) => {
    const server = await self.db.servers.fetch({ _id: member.guild.id })

    await Automation.handleEvent('ROLE_MEMBER_REMOVE', self, server, member)

    const temprole = self.temproles.find(i => i.user_id === member.id)

    if (temprole && roles.some(i => i.id === temprole.role_id)) {
        await temprole.delete()
    }

    await Logs.RoleMemberRemove(self, server, member, roles)

    return true
}

export default {
    name: 'roleMemberRemove',
    handler
}
