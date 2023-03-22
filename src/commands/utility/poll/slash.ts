import { ActionRowBuilder, ModalActionRowComponentBuilder, ModalBuilder, TextInputBuilder } from '@discordjs/builders'
import { ChatInputCommandInteraction, TextInputStyle } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export async function createSlash(self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction) {
    const t = self.i18n.t.bind(null, server.locale)

    const quizMode = Boolean(interaction.options?.getInteger(self.i18n.t('en', 'commands.poll.create.options.quiz_mode.name')))
    const multipleAnswers = Boolean(interaction.options?.getInteger(self.i18n.t('en', 'commands.poll.create.options.multiple_answers.name')))

    const modal = new ModalBuilder()
        .setCustomId(`POLL-${interaction.id}-${quizMode}-${multipleAnswers}`)
        .setTitle(t('commands.poll.create.text_create_new_poll'))
        .addComponents(
            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId('POLL-QUESTION')
                    .setLabel(t('commands.poll.create.text_poll_question'))
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
                    .setLabel(t('commands.poll.create.text_correct_answer'))
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
                .setLabel(t('commands.poll.create.text_answer_options'))
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder(t('commands.poll.create.text_answer_options_placeholder'))
                .setRequired(true)
        )
    )

    await interaction.showModal(modal)

    return true
}
