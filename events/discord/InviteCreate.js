const { InviteCreate } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').Invite} invite
 */
const execute = async (self, invite) => {
    const server = await self.db.servers.find({ _id: invite.guild.id })

    if (!server) return false

    await InviteCreate(self, server, invite)

    return true
}

module.exports = {
    name: 'inviteCreate',
    fn: execute
}