import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AttachmentBuilder, ContextMenuCommandInteraction } from 'discord.js'
import Lacuna from '../../../internals/Lacuna'
import { generateRankCard } from '../../../modules/Levels'

export default async (self: Lacuna, server: ServerDocument, interaction: ContextMenuCommandInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)

    if (!server.modules.levels.active && !server.modules.levels.voice) {
        await interaction.reply({
            content: `${self.staticEmojis.ERROR} | ${t('Commands.LeadersCommand.Texts.LevelsIsDisabled', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })
    let attachment: AttachmentBuilder

    try {
        attachment = await generateRankCard(self, interaction)
    } catch (err) {
        await interaction.editReply({
            content: `${self.staticEmojis.ERROR} | ${t('Commands.RankCommand.Texts.ImageRenderError', {
                username: `**${interaction.member.displayName}**`
            })}`
        })

        return false
    }

    if (!attachment) {
        await interaction.editReply({
            content: `${self.staticEmojis.ERROR} | ${t('Commands.RankCommand.Texts.LevelCardNotFound', {
                username: `**${interaction.member.displayName}**`
            })}`
        })

        return false
    }

    await interaction.editReply({ files: [attachment] })

    return true
}
