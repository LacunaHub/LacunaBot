import {
    ActionRowBuilder,
    BaseGuildTextChannel,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    EmbedBuilder,
    Guild,
    ModalActionRowComponentBuilder,
    ModalBuilder,
    ModalSubmitInteraction,
    TextInputBuilder,
    TextInputStyle,
    User
} from 'discord.js'
import db from '../../database'
import { ServerDocument } from '../../database/schemas/Servers'
import i18n from '../../i18n'
import Lacuna from '../../internals/Lacuna'
import Logger from '../../internals/Logger'
import { snakeToPascalCase } from '../../internals/utility/Utils'
import { images } from '../Logs'

export async function createCaseEntry(guild: Guild, options: ICreateCaseMessageOptions) {
    const server = await db.servers.findOne({ _id: guild.id })
    const caseLog = guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel

    if (caseLog && server.moderation.case_log.types[options.type].active) {
        const t = i18n.t.bind(null, server.locale)
        const caseId = server.moderation.case_log.case_count + 1

        try {
            await caseLog.send({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: t(`case_log.cases.${options.type}`), iconURL: images[options.type] })
                        .addFields([
                            {
                                name: t('common.command_option_types.USER'),
                                value: options.target ? `${options.target.tag}\n(${options.target.id})` : '-',
                                inline: true
                            },
                            { name: t('case_log.moderator'), value: options.executor.tag, inline: true },
                            { name: t('case_log.reason'), value: options.reason ?? '-' }
                        ])
                        .setFooter({ text: t('case_log.case_number', { case_number: caseId }) })
                        .setTimestamp()
                        .setColor(options.type.endsWith('REMOVE') ? '#2FDF84' : '#EF5350')
                ],
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder().setCustomId(`CL-REASON-${caseId}`).setLabel(t('case_log.change_reason')).setStyle(ButtonStyle.Secondary)
                    )
                ]
            })
        } catch (err) {
            Logger.handleError({ module: 'CaseLog', action: 'SendCaseMessage', error: err, guild_id: guild.id })

            return
        }

        await db.servers.updateOne(
            { _id: server._id },
            {
                $inc: {
                    'moderation.case_log.case_count': 1
                },
                $push: {
                    'moderation.case_log.cases': {
                        case_id: caseId,
                        type: options.type,
                        timestamp: Date.now(),
                        reason: options.reason ?? null,
                        target: {
                            id: options.target ? options.target.id : null,
                            name: options.target ? options.target.tag : null
                        },
                        executor: {
                            id: options.executor.id,
                            name: options.executor.tag
                        }
                    }
                }
            }
        )

        guild.client.emit('moduleExecution', {
            module: 'Moderation',
            category: 'CaseLog',
            label: snakeToPascalCase(options.type),
            guild: { id: guild.id, name: guild.name },
            target: { id: options.target.id, name: options.target.tag }
        })
    }
}

export async function onPressChangeReasonButton(self: Lacuna, server: ServerDocument, interaction: ButtonInteraction) {
    if (!interaction.memberPermissions.has(self.PermissionFlags.ManageMessages)) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.i18n.t(server.locale, 'common.command_denied', {
                user: `**${interaction.user.username}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    const [, , caseId] = interaction.customId.split('-')
    const caseEntry = server.moderation.case_log.cases.find(i => i.case_id === Number(caseId))

    if (!caseEntry) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.i18n.t(server.locale, 'commands.reason.text_no_case_entry', {
                user: `**${interaction.user.username}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    const modal = new ModalBuilder()
        .setCustomId(`CL-REASON-${caseId}`)
        .setTitle(self.i18n.t(server.locale, 'case_log.case_number', { case_number: caseId }))
        .addComponents(
            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId('CL-REASON')
                    .setLabel(self.i18n.t(server.locale, 'case_log.reason'))
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(1000)
                    .setRequired(true)
                    .setValue(typeof caseEntry.reason === 'string' ? caseEntry.reason : '')
            )
        )

    await interaction.showModal(modal)
}

export async function onSubmitChangeReasonModal(self: Lacuna, server: ServerDocument, interaction: ModalSubmitInteraction) {
    const reason = interaction.fields.getTextInputValue('CL-REASON').trim()

    if (!reason) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.i18n.t(server.locale, 'commands.reason.text_no_reason', {
                user: `**${interaction.user.username}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    let [, , caseId] = interaction.customId.split('-')
    const embed = new EmbedBuilder(interaction.message.embeds[0].toJSON())
    embed.data.fields[2].value = reason

    await interaction.message.edit({ embeds: [embed] })
    await self.db.servers.updateOne(
        { _id: interaction.guild.id, 'moderation.case_log.cases.case_id': Number(caseId) },
        {
            $set: {
                'moderation.case_log.cases.$.reason': reason
            }
        }
    )

    await interaction.reply({
        content: `${self._emojis.OK} | ${self.i18n.t(server.locale, 'commands.reason.text_case_edited', {
            user: `**${interaction.user.username}**`
        })}`,
        ephemeral: true
    })

    self.emit('moduleExecution', {
        module: 'Moderation',
        category: 'CaseLog',
        label: 'ChangeReason',
        guild: { id: interaction.guildId, name: interaction.guild.name },
        target: { id: interaction.user.id, name: interaction.user.tag }
    })
}

export interface ICreateCaseMessageOptions {
    type: 'BAN_ADD' | 'BAN_REMOVE' | 'KICK' | 'MUTE_ADD' | 'MUTE_REMOVE' | 'PRUNE_MESSAGES' | 'WARN_ADD' | 'WARN_REMOVE'
    target?: User
    executor: User
    reason?: string
}
