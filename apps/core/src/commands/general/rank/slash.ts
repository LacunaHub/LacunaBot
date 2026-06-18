import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { generateRankCard } from '@/modules/Levels.js'
import { AttachmentBuilder, ChatInputCommandInteraction } from 'discord.js'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)

    if (!server.modules.levels.active && !server.modules.levels.voice) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.LeadersCommand.Texts.LevelsIsDisabled', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply()
    let attachment: AttachmentBuilder

    try {
        attachment = await generateRankCard(self, interaction)
    } catch (err) {
        await interaction.editReply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.RankCommand.Texts.ImageRenderError', {
                username: `**${interaction.member.displayName}**`
            })}`
        })

        return false
    }

    if (!attachment) {
        await interaction.editReply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.RankCommand.Texts.LevelCardNotFound', {
                username: `**${interaction.member.displayName}**`
            })}`
        })

        return false
    }

    await interaction.editReply({ files: [attachment] })

    return true
}
