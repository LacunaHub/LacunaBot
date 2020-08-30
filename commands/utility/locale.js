/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    let locale = self.translator.locale(server.locale).commands

    let language = args[0]

    if (!language) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.locale.texts.language_not_entered, `**${message.author.username}**`)}`)

        return false
    }

    if (['ru', 'ru-ru', 'ру', 'рус', 'русский'].includes(language.toLowerCase())) {
        language = 'ru'
    }

    else if (['en', 'en-us', 'eng', 'english'].includes(language.toLowerCase())) {
        language = 'en'
    }

    else {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.locale.texts.unknown_locale, `**${message.author.username}**`)}`)

        return false
    }

    if (server.locale == language) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.locale.texts.locale_already_selected, `**${message.author.username}**`)}`)

        return false
    }

    locale = self.translator.locale(language).commands

    await self.db.servers.update({ _id: message.guild.id }, {
        $set: {
            'locale': language
        }
    })

    await message.channel.send(`${self._emojis.OK} | ${self.translator.format(locale.locale.texts.locale_set, `**${message.author.username}**`)}`)

    return true
}

module.exports = {
    fn: execute,
    name: 'locale',
    description: 'commands.locale.description',
    group: 'utility',
    guild_only: true,
    self_permissions: ['SEND_MESSAGES'],
    user_permissions: ['ADMINISTRATOR']
}