import { BaseGuildTextChannel, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)

    const case_id = interaction.options?.getInteger('case-number')
    const reason = interaction.options?.getString('reason')

    if (!case_id) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('Commands.ReasonCommand.Texts.InvalidCaseId', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (!reason) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('Commands.ReasonCommand.Texts.InvalidReason', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    const case_log = interaction.guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel

    if (!case_log) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('Commands.ReasonCommand.Texts.CaseLogIsNotSet', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })
    const messages = await case_log.messages.fetch({ limit: 50, cache: false })
    const case_message = messages.find(m => m.author.id == self.user.id && m.embeds[0]?.footer?.text?.includes(`#${case_id}`))

    if (!case_message) {
        await interaction.editReply({
            content: `${self._emojis.ERROR} | ${t('Commands.ReasonCommand.Texts.CaseMessageNotFound', {
                username: `**${interaction.member.displayName}**`
            })}`
        })

        return false
    }

    const embed = new EmbedBuilder(case_message.embeds[0])

    embed.data.fields[1].value = interaction.user.tag
    embed.data.fields[2].value = reason

    await case_message.edit({ embeds: [embed] })

    await interaction.editReply({
        content: `${self._emojis.OK} | ${t('Commands.ReasonCommand.Texts.CaseReasonHasBeenChanged', {
            username: `**${interaction.member.displayName}**`
        })}`
    })

    return true
}
