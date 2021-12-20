import { Invite } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { InviteDelete } from '../../modules/Logs'

const handler = async (self: Lacuna, invite: Invite) => {
    const server: ServerDocument = await self.db.servers.findOne({ _id: invite.guild.id })

    if (!server) return false

    await InviteDelete(self, server, invite)

    return true
}

export default {
    name: 'inviteDelete',
    handler
}