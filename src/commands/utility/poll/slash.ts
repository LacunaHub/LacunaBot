import { ActionRowBuilder, ModalActionRowComponentBuilder, ModalBuilder, TextInputBuilder } from '@discordjs/builders'
import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { ChatInputCommandInteraction, TextInputStyle } from 'discord.js'
import Lacuna from '../../../internals/Lacuna'

export async function createSlash(self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) {
    const t = self.i18n.t.bind(null, server.locale)

    const quizMode = Boolean(interaction.options?.getInteger('quiz-mode'))
    const multipleAnswers = Boolean(interaction.options?.getInteger('multiple-answers'))

    const modal = new ModalBuilder()
        .setCustomId(`POLL-${interaction.id}-${quizMode}-${multipleAnswers}`)
        .setTitle(t('Commands.PollCommand.SubCommands.CreateCommand.Texts.NewPoll'))
        .addComponents(
            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId('POLL-QUESTION')
                    .setLabel(t('Commands.PollCommand.SubCommands.CreateCommand.Texts.PollQuestion'))
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(200)
                    .setRequired(true)
            )
        )

    if (quizMode) {
        modal.addComponents(
            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId('CORRECT-ANSWER')
                    .setLabel(t('Commands.PollCommand.SubCommands.CreateCommand.Texts.CorrectAnswer'))
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(200)
                    .setRequired(true)
            )
        )
    }

    modal.addComponents(
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
            new TextInputBuilder()
                .setCustomId('ANSWER-OPTIONS')
                .setLabel(t('Commands.PollCommand.SubCommands.CreateCommand.Texts.AnswerOptions'))
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder(t('Commands.PollCommand.SubCommands.CreateCommand.Texts.AnswerOptionsPlaceholder'))
                .setRequired(true)
        )
    )

    await interaction.showModal(modal)

    return true
}
