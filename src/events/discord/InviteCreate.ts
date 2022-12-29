import { Events, Invite } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { InviteCreate } from '../../modules/Logs'

const handler = async (self: Lacuna, invite: Invite) => {
    const server: ServerDocument = await self.db.servers.findOne({ _id: invite.guild.id })

    if (!server) return false

    await InviteCreate(self, server, invite)

    return true
}

export default {
    name: Events.InviteCreate,
    handler
}
