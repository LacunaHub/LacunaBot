const ban = require('./ban')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    await ban.fn(self, server, message, args)

    return true
}

module.exports = {
    fn: execute,
    name: 'tempban',
    description: 'commands.ban.description',
    group: 'moderation',
    guild_only: true,
    private: true,
    self_permissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'BAN_MEMBERS'],
    user_permissions: ['BAN_MEMBERS']
}