const { GenerateRankCard } = require('../../modules/Levels')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    if (!server.modules.levels.active) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.rank.texts.levels_is_disabled, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    let attachment
    try {
        attachment = await GenerateRankCard(self, message, args)
    } catch (err) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.rank.texts.error_on_render, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (!attachment) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.rank.texts.no_rank_card, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    await message.reply({ files: [attachment], allowedMentions: { repliedUser: false } })

    return true
}

module.exports = {
    fn: execute,
    name: 'rank',
    description: 'commands.rank.description',
    group: 'general',
    aliases: ['level'],
    guild_only: true,
    self_permissions: ['SEND_MESSAGES', 'ATTACH_FILES']
}