import { CommandInteraction, MessageAttachment } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { generateRankCard } from '../../../modules/Levels'

export default async (self: Lacuna, server: ServerDocument, interaction: CommandInteraction) => {
    const t = self.i18n.t.bind(null, server.locale)

    if (!server.modules.levels.active && !server.modules.levels.voice) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.leaders.text_levels_disabled', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })
    let attachment: MessageAttachment

    try {
        attachment = await generateRankCard(self, interaction)
    } catch (err) {
        await interaction.editReply({
            content: `${self._emojis.ERROR} | ${t('commands.rank.text_render_error', { user: `**${(interaction.member as any).displayName}**` })}`
        })

        return false
    }

    if (!attachment) {
        await interaction.editReply({
            content: `${self._emojis.ERROR} | ${t('commands.rank.text_no_rank_card', { user: `**${(interaction.member as any).displayName}**` })}`
        })

        return false
    }

    await interaction.editReply({ files: [attachment] })

    return true
}
