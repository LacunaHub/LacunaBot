import { ContextMenuInteraction, MessageAttachment } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { generateRankCard } from '../../../modules/Levels'

export default async (self: Lacuna, server: ServerDocument, interaction: ContextMenuInteraction) => {
    const locale = self.translator.locale(server.locale).commands

    if (!server.modules.levels.active && !server.modules.levels.voice) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.rank.texts.levels_is_disabled, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    let attachment: MessageAttachment
    
    try {
        attachment = await generateRankCard(self, interaction)
    } catch (err) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.rank.texts.error_on_render, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!attachment) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.rank.texts.no_rank_card, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    await interaction.reply({ files: [attachment] })

    return true
}