/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const channel = message.mentions.channels.first() || message.guild.channels.cache.find(c => c.id == args[0] || c.name == args[0])

    if (!args[0]) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.cases.texts.no_channel_argument, `**${message.author.username}**`)}`)

        return false
    }

    if (!channel || channel.type != 'text') {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.cases.texts.invalid_channel, `**${message.author.username}**`)}`)

        return false
    }

    await self.db.servers.update({ _id: message.guild.id }, {
        $set: {
            'moderation.case_log.channel_id': channel.id
        }
    })

    await message.channel.send(`${self._emojis.OK} | ${self.translator.format(locale.cases.texts.case_log_set, `**${message.author.username}**`, `**#${channel.name}**`)}`)

    return true
}

module.exports = {
    fn: execute,
    name: 'cases',
    description: 'commands.cases.description',
    group: 'moderation',
    guild_only: true,
    self_permissions: ['SEND_MESSAGES'],
    user_permissions: ['ADMINISTRATOR']
}