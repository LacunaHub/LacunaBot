const help = require('../general/help')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const log_type = args[0]
    const channel = message.mentions.channels.first() || message.guild.channels.cache.filter(c => ['text', 'news'].includes(c.type)).find(c => c.id == args[1] || c.name == args[1])

    if (!log_type) {
        await help.fn(self, server, message, ['logs'])

        return false
    }

    const log_type_exists = log_type in server.moderation.logs.types

    if (!log_type_exists) {
        const log_types = Object.keys(server.moderation.logs.types).filter(k => k != '$init').map(k => `\`${k}\``).join(', ')
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.logs.texts.unknown_log_type, `**${message.author.username}**`, log_types)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (!channel && args[1] != 'OFF') {
        await message.react(self._emojis.details.ERROR.id)

        return false
    }

    await self.db.servers.update({ _id: message.guild.id }, {
        [`moderation.logs.types.${log_type}.active`]: args[1] == 'OFF' ? false : true,
        [`moderation.logs.types.${log_type}.channel_id`]: args[1] == 'OFF' ? '' : channel.id
    })

    await message.reply(`${self._emojis.OK} | ${self.translator.format(args[1] == 'OFF' ? locale.logs.texts.log_type_disable : locale.logs.texts.log_type_activated, `**${message.author.username}**`, `\`${log_type}\``)}`, { allowedMentions: { repliedUser: false } })

    return true
}

module.exports = {
    fn: execute,
    name: 'logs',
    description: 'commands.logs.description',
    group: 'utility',
    guild_only: true,
    self_permissions: ['SEND_MESSAGES', 'MANAGE_WEBHOOKS'],
    user_permissions: ['ADMINISTRATOR']
}