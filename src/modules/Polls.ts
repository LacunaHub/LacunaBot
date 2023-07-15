import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from '@discordjs/builders'
import { ButtonInteraction, ButtonStyle, Message, ModalSubmitInteraction } from 'discord.js'
import { ServerDocument } from '../database/schemas/Servers'
import Lacuna from '../internals/Lacuna'
import { emojiLetters } from '../internals/utility/Constants'
import { chunkArray } from '../internals/utility/Utils'

export async function createPoll(self: Lacuna, server: ServerDocument, interaction: ModalSubmitInteraction) {
    const pollQuestion = interaction.fields.getTextInputValue('POLL-QUESTION').trim()
    let correctAnswer: string
    const answerOptionsRaw = interaction.fields.getTextInputValue('ANSWER-OPTIONS')
    let answerOptions = answerOptionsRaw
        .split(/[\r\n]+/)
        .map(i => i.trim())
        .filter(i => i)

    if (!pollQuestion) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.i18n.t(server.locale, 'commands.poll.create.text_no_question', {
                user: `**${interaction.user.username}**`
            })}`,
            ephemeral: true
        })

        return
    }

    let [, , quizMode, multipleAnswers] = interaction.customId.split('-')
    const isQuizMode = quizMode === 'true'
    let isMultipleAnswers = multipleAnswers === 'true'

    if (answerOptions.length < (isQuizMode ? 1 : 2)) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.i18n.t(server.locale, 'commands.poll.create.text_invalid_answer_options', {
                user: `**${interaction.user.username}**`
            })}`,
            ephemeral: true
        })

        return
    }

    if (isQuizMode) {
        isMultipleAnswers = false
        correctAnswer = interaction.fields.getTextInputValue('CORRECT-ANSWER').trim()

        if (!correctAnswer) {
            await interaction.reply({
                content: `${self._emojis.ERROR} | ${self.i18n.t(server.locale, 'commands.poll.create.text_no_correct_answer', {
                    user: `**${interaction.user.username}**`
                })}`,
                ephemeral: true
            })

            return
        }

        answerOptions = answerOptions.slice(0, 9)
        answerOptions.splice(Math.round(Math.random() * answerOptions.length), 0, correctAnswer)
    } else {
        answerOptions = answerOptions.slice(0, 10)
    }

    const answerOptionsChunks = chunkArray(answerOptions, 5)

    const embed = new EmbedBuilder().setTitle(pollQuestion).addFields(
        ...answerOptions.map((i, idx) => {
            let fieldValue = `0% - ${self.i18n.pluralize(server.locale, 'commands.poll.text_plural_votes', 0)}`

            if (isQuizMode) {
                fieldValue = '||' + fieldValue + '||'
            }

            return {
                name: `${emojiLetters[idx]} ${i}`,
                value: fieldValue
            }
        })
    )

    if (isQuizMode) {
        embed.setFooter({ text: self.i18n.t(server.locale, 'commands.poll.create.text_quiz_mode') })
    }

    if (isMultipleAnswers) {
        embed.setFooter({ text: self.i18n.t(server.locale, 'commands.poll.create.text_multiple_answers') })
    }

    const rows = answerOptionsChunks.map((i: string[]) => {
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
            ...i.map(ii => {
                const idx = answerOptions.indexOf(ii)

                return new ButtonBuilder()
                    .setCustomId(`POLL-${interaction.id}-OPT-${idx}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji({ name: emojiLetters[idx] })
            })
        )
    })

    let message: Message

    try {
        message = await interaction.channel.send({ embeds: [embed], components: rows })
    } catch (err) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.i18n.t(server.locale, 'commands.poll.create.text_poll_failed_to_create', {
                user: `**${interaction.user.username}**`
            })}`,
            ephemeral: true
        })

        self.logger.handleError({ module: 'Polls', action: 'SendPollMessage', error: err, guild_id: interaction.guildId })

        return
    }

    await self.db.servers.updateOne(
        { _id: interaction.guildId },
        {
            $push: {
                'utility.polls': {
                    $each: [
                        {
                            message_id: message.id,
                            channel_id: message.channelId,
                            poll_question: pollQuestion,
                            answer_options: answerOptions.map((i, idx) => {
                                const opt = {
                                    title: i,
                                    index: idx,
                                    voters: []
                                }

                                if (quizMode && i === correctAnswer) {
                                    opt['correct'] = true
                                }

                                return opt
                            }),
                            quiz: isQuizMode,
                            multiple_answers: isMultipleAnswers
                        }
                    ],
                    $slice: -20
                }
            }
        }
    )

    await interaction.reply({
        content: `${self._emojis.OK} | ${self.i18n.t(server.locale, 'commands.poll.create.text_poll_successfully_created', {
            user: `**${interaction.user.username}**`
        })}`,
        ephemeral: true
    })
}

export async function onPressPollButton(self: Lacuna, server: ServerDocument, interaction: ButtonInteraction) {
    const [, , , optionIndex] = interaction.customId.split('-')
    const poll = server.utility.polls.find(i => i.message_id === interaction.message.id)
    const option = poll?.answer_options?.find?.(i => i.index === Number(optionIndex))

    if (option) {
        const alreadyVoted = option.voters.includes(interaction.user.id)
        let totalVotes = poll.answer_options.map(i => i.voters.length).reduce((x, y) => (x += y), 0) + 1

        if (alreadyVoted && !poll.multiple_answers) {
            await interaction.reply({
                content: `${self._emojis.ERROR} | ${self.i18n.t(server.locale, 'commands.poll.text_option_already_chosen', {
                    user: `**${interaction.user.username}**`
                })}`,
                ephemeral: true
            })

            return
        }

        const dataToUpdate = {
            $push: { [`utility.polls.$.answer_options.${optionIndex}.voters`]: interaction.user.id },
            $pull: {}
        }
        const otherVotedOption = poll.answer_options.find(i => i.voters.includes(interaction.user.id))

        if (otherVotedOption) {
            if (poll.quiz) {
                await interaction.reply({
                    content: `${self._emojis.ERROR} | ${self.i18n.t(server.locale, 'commands.poll.text_option_chosen_quiz_mode', {
                        user: `**${interaction.user.username}**`,
                        answer: `**${otherVotedOption.title}**`
                    })}`,
                    ephemeral: true
                })

                return
            }

            if (!poll.multiple_answers) {
                totalVotes -= 1

                dataToUpdate.$pull[`utility.polls.$.answer_options.${otherVotedOption.index}.voters`] = interaction.user.id
            }
        }

        if (alreadyVoted) {
            totalVotes -= 1

            dataToUpdate.$push = {}
            dataToUpdate.$pull[`utility.polls.$.answer_options.${optionIndex}.voters`] = interaction.user.id
        }

        const pollEmbed = interaction.message.embeds[0]
        const embed = new EmbedBuilder(pollEmbed.toJSON()).setFields(
            ...pollEmbed.fields.map((i, idx) => {
                const opt = poll.answer_options.find(i => i.index === idx)
                let optVotes = opt.voters.length

                if (opt.index === option.index && !alreadyVoted) {
                    optVotes += 1
                }

                if ((opt.index === otherVotedOption?.index && !poll.multiple_answers) || (opt.index === option.index && alreadyVoted)) {
                    optVotes -= 1
                }

                const optVotesPercent = Math.round((optVotes * 100) / totalVotes) || 0
                let fieldValue = `${optVotesPercent}% - ${self.i18n.pluralize(server.locale, 'commands.poll.text_plural_votes', optVotes)}`

                if (poll.quiz) {
                    fieldValue = '||' + fieldValue + '||'
                }

                return {
                    name: i.name,
                    value: fieldValue
                }
            })
        )

        await self.db.servers.updateOne({ _id: interaction.guildId, 'utility.polls.message_id': interaction.message.id }, dataToUpdate)
        await interaction.message.edit({ embeds: [embed] })

        if (poll.quiz) {
            let text = self.i18n.t(server.locale, 'commands.poll.text_incorrect_answer', { user: `**${interaction.user.username}**` })

            if (option.correct) {
                text = self.i18n.t(server.locale, 'commands.poll.text_answer_is_correct', {
                    user: `**${interaction.user.username}**`,
                    answer: `**${option.title}**`
                })
            }

            await interaction.reply({ content: `${option.correct ? self._emojis.OK : self._emojis.ERROR} | ${text}`, ephemeral: true })
        } else {
            let text = self.i18n.t(server.locale, 'commands.poll.text_you_have_chosen', {
                user: `**${interaction.user.username}**`,
                answer: `**${option.title}**`
            })

            if (alreadyVoted) {
                text = self.i18n.t(server.locale, 'commands.poll.text_you_removed_your_vote', {
                    user: `**${interaction.user.username}**`,
                    answer: `**${option.title}**`
                })
            }

            await interaction.reply({ content: `${self._emojis.OK} | ${text}`, ephemeral: true })
        }
    }
}
