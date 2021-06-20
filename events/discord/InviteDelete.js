const InviteDelete = require('../../modules/Logs/Guild/InviteDelete')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').Invite} invite
 */
const execute = async (self, invite) => {
    const server = await self.db.servers.find({ _id: invite.guild.id })

    if (!server) return false

    await InviteDelete(self, server, invite)

    return true
}

module.exports = {
    name: 'inviteDelete',
    fn: execute
}