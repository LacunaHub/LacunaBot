const help = require('../general/help')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const prefix = args[0]

    if (!prefix) {
        await help.fn(self, server, message, ['prefix'])

        return false
    }

    if (prefix.length > 3) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.prefix.texts.prefix_max_length, `**${message.author.username}**`)}`)

        return false
    }

    await self.db.servers.update({ _id: message.guild.id }, {
        $set: {
            'prefix': prefix
        }
    })

    await message.channel.send(`${self._emojis.OK} | ${self.translator.format(locale.prefix.texts.prefix_set, `**${message.author.username}**`, `\`${server.prefix}\``, `\`${prefix}\``)}`)

    return true
}

module.exports = {
    fn: execute,
    name: 'prefix',
    description: 'commands.prefix.description',
    group: 'utility',
    guild_only: true,
    self_permissions: ['SEND_MESSAGES'],
    user_permissions: ['ADMINISTRATOR']
}