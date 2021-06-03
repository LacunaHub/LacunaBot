const mute = require('./mute')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    await mute.fn(self, server, message, args)

    return true
}

module.exports = {
    fn: execute,
    name: 'tempmute',
    description: 'commands.mute.description',
    group: 'moderation',
    guild_only: true,
    private: true,
    self_permissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_ROLES'],
    user_permissions: ['MANAGE_ROLES']
}