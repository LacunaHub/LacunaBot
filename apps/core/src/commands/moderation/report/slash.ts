import { ReportType } from '@/database/schemas/Reports.js'
import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import {
    ActionRowBuilder,
    BaseGuildTextChannel,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    Collection,
    EmbedBuilder,
    GuildMember,
    Message,
    ModalSubmitInteraction,
    StringSelectMenuBuilder
} from 'discord.js'
import moment from 'moment'
import ms from 'ms'

export default async (
    self: Lacuna,
    server: ServerDocument,
    interaction: ChatInputCommandInteraction<'cached'> | ModalSubmitInteraction<'cached'>
) => {
    const t = self.i18n.t.bind(null, server.locale)

    let mention!: GuildMember
    let reason!: string

    if (interaction.isChatInputCommand()) {
        mention = interaction.options?.getMember('user') as GuildMember
        reason = interaction.options?.getString('reason')!
    }

    if (interaction.isModalSubmit()) {
        const [, targetId] = interaction.customId.split('-')
        const cache = self.cache.get(`REPORT-${targetId}-${interaction.user.id}`)

        mention = cache?.targetMember
        reason = interaction.fields
            .getTextInputValue('REPORT-REASON')
            .trim()
            .replace(/\s{2,}/, ' ')
    }

    if (!mention || mention.user.bot) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.ReportCommand.Texts.InvalidUser', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (!reason || reason.length < 20) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.ReportCommand.Texts.InvalidReason', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })

    const report = await self.db.reports.findOne({
        complainant_id: interaction.user.id,
        accused_id: mention.id,
        created_at: { $gt: Date.now() - ms('24h') }
    })

    if (report) {
        await interaction.editReply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.ReportCommand.Texts.YouRecentlyReportedThisUser', {
                username: `**${interaction.member.displayName}**`
            })}`
        })

        return false
    }

    const reportCount = await self.db.reports.countDocuments({
        type: ReportType.User,
        complainant_id: interaction.user.id,
        created_at: { $gt: Date.now() - ms('24h') }
    })

    if (reportCount >= 3) {
        await interaction.editReply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.ReportCommand.Texts.YouHaveToManySubmittedReports', {
                username: `**${interaction.member.displayName}**`
            })}`
        })

        return false
    }

    await self.db.reports.create({
        type: ReportType.User,
        complainant_id: interaction.user.id,
        accused_id: mention.id,
        content: reason,
        metadata: {
            from_guild_id: interaction.guildId
        }
    })

    if (server.modules.reports.active && server.modules.reports.channel_id) {
        const channel = interaction.guild.channels.cache.get(server.modules.reports.channel_id) as BaseGuildTextChannel

        if (channel) {
            let reportMessages!: Collection<string, Message>, reportMessage!: Message

            try {
                reportMessages = await channel.messages.fetch({ limit: 50, cache: false })
                reportMessage = reportMessages?.find(i => {
                    return (
                        i.author.id === self.user!.id &&
                        i.embeds[0]?.footer?.text?.startsWith(`ID: ${mention.id}`) &&
                        i.components.length
                    )
                })!
            } catch (err) {}

            if (reportMessage) {
                const embed = new EmbedBuilder(reportMessage.embeds[0] as any)
                const fields = embed.data.fields?.length === 25 ? embed.data.fields.slice(1, 25) : embed.data.fields

                embed.setFields([
                    ...(fields ?? []),
                    {
                        name: `<t:${Math.round(Date.now() / 1000)}:R>`,
                        value: `<@${interaction.user.id}> (${interaction.user.tag})\n\n${reason}`
                    }
                ])

                try {
                    await reportMessage.edit({ embeds: [embed] })
                } catch (err) {
                    self.logger.error({
                        module: 'ReportCommand',
                        action: 'EditReportMessage',
                        err,
                        guildId: interaction.guildId
                    })
                }
            } else {
                const embed = new EmbedBuilder()
                    // .setAuthor({ name: mention.user.tag, iconURL: mention.user.displayAvatarURL() })
                    .addFields([
                        {
                            name: `<t:${Math.round(Date.now() / 1000)}:R>`,
                            value: `<@${interaction.user.id}> (${interaction.user.tag})\n\n${reason}`
                        }
                    ])
                    .setFooter({ text: `ID: ${mention.id}` })

                const selectMenuOptions = [
                    'indefinitely',
                    '10m',
                    '30m',
                    '1h',
                    '2h',
                    '5h',
                    '12h',
                    '1d',
                    '3d',
                    '7d',
                    '14d'
                ].map(i => {
                    return {
                        label:
                            i === 'indefinitely'
                                ? t('Common.Indefinitely').toLowerCase()
                                : moment(Date.now() + ms(i))
                                      .locale(server.locale)
                                      .fromNow(true),
                        value: i
                    }
                })

                const rows = [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`R-KICK-${mention.id}`)
                            .setLabel(t('CaseLog.Actions.Kick'))
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId(`R-WARN-${mention.id}`)
                            .setLabel(t('CaseLog.Actions.Warn'))
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId(`R-SKIP-${mention.id}`)
                            .setLabel(t('Common.Close'))
                            .setStyle(ButtonStyle.Secondary)
                    ),
                    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId(`R-BAN-${mention.id}`)
                            .setPlaceholder(t('CaseLog.Actions.Ban'))
                            .setOptions(selectMenuOptions)
                    ),
                    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId(`R-MUTE-${mention.id}`)
                            .setPlaceholder(t('CaseLog.Actions.Mute'))
                            .setOptions(selectMenuOptions.slice(1))
                    )
                ]

                try {
                    await channel.send({
                        content: t('Commands.ReportCommand.Texts.ReceivedReportAboutUser', {
                            username: `<@${mention.id}> (${mention.user.tag})`
                        }),
                        embeds: [embed],
                        components: rows
                    })
                } catch (err) {
                    self.logger.error({
                        module: 'ReportCommand',
                        action: 'SendReportMessage',
                        err,
                        guildId: interaction.guildId
                    })
                }
            }
        }
    }

    await interaction.editReply({
        content: `${self.staticEmojis.Check} | ${t('Commands.ReportCommand.Texts.ReportSubmitted', {
            username: `**${interaction.member.displayName}**`
        })}`
    })
    self.cache.delete(`REPORT-${mention.id}-${interaction.user.id}`)

    return true
}
