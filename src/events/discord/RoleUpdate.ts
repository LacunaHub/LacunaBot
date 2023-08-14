import { Events, Role } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import Logs from '../../modules/Logs'

const handler = async (self: Lacuna, before: Role, role: Role) => {
    if (before.position != role.position) return false

    const server: ServerDocument = await self.db.servers.findOne({ _id: role.guild.id })

    if (!server) return false

    await Logs.RoleUpdate(self, server, before, role)

    return true
}

export default {
    name: Events.GuildRoleUpdate,
    handler
}
