import { Role } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { RoleDelete } from '../../modules/Logs'

const handler = async (self: Lacuna, role: Role) => {
    const server: ServerDocument = await self.db.servers.findOne({ _id: role.guild.id })

    if (!server) return false

    await RoleDelete(self, server, role)

    return true
}

export default {
    name: 'roleDelete',
    handler
}