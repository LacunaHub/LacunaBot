const { servers } = require('../../../database/DatabaseManager')
const { GenerateRankCard } = require('../../../modules/Levels')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').ContextMenuInteraction} interaction
 */
module.exports = async (self, server, interaction) => {
    const locale = self.translator.locale(server.locale).commands

    if (!server.modules.levels.active && !server.modules.levels.voice) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.rank.texts.levels_is_disabled, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    let attachment
    
    try {
        attachment = await GenerateRankCard(self, interaction)
    } catch (err) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.rank.texts.error_on_render, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!attachment) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.rank.texts.no_rank_card, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    await interaction.reply({ files: [attachment] })

    return true
}