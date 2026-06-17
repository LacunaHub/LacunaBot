import Lacuna from '@/internals/Lacuna.js'
import Logs from '@/modules/Logs/index.js'
import { Events, Invite } from 'discord.js'

const handler = async (self: Lacuna, invite: Invite) => {
    const server = await self.db.servers.findOne({ _id: invite.guild!.id })

    if (!server) return false

    await Logs.InviteCreate(self, server, invite)

    return true
}

export default {
    name: Events.InviteCreate,
    handler
}
