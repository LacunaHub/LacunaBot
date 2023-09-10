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
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction | ModalSubmitInteraction) => {
    const t = self.i18n.t.bind(null, server.locale)

    let mention: GuildMember
    let reason: string

    if (interaction.isChatInputCommand()) {
        mention = interaction.options?.getMember('user') as GuildMember
        reason = interaction.options?.getString('reason')
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
            content: `${self._emojis.ERROR} | ${t('commands.report.text_no_mention', { user: `**${interaction.member['displayName']}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (!reason || reason.length < 20) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.report.text_invalid_reason', { user: `**${interaction.member['displayName']}**` })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })

    let mentionUser = await self.db.users.findOne({ _id: mention.id })

    if (!mentionUser) {
        mentionUser = await self.db.users.create({
            _id: mention.id,
            user: {
                username: mention.user.username,
                discriminator: mention.user.discriminator,
                avatar: mention.user.avatar,
                flags: mention.user.flags
            }
        } as any)
    }

    const report = mentionUser.reports.find(i => i.sender_id === interaction.user.id)

    if (report && Date.now() - report.created_at < ms('24h')) {
        await interaction.editReply({
            content: `${self._emojis.ERROR} | ${t('commands.report.text_user_recently_reported', {
                user: `**${interaction.member['displayName']}**`
            })}`
        })

        return false
    }

    const reportCount = await self.db.users.countDocuments({
        'reports.sender_id': interaction.user.id,
        'reports.created_at': { $gt: Date.now() - ms('24h') }
    })

    if (reportCount >= 3) {
        await interaction.editReply({
            content: `${self._emojis.ERROR} | ${t('commands.report.text_to_many_recent_reports', {
                user: `**${interaction.member['displayName']}**`
            })}`
        })

        return false
    }

    await self.db.users.updateOne(
        { _id: mention.id },
        {
            $push: {
                reports: {
                    $each: [
                        {
                            sender_id: interaction.user.id,
                            guild_id: interaction.guildId,
                            reason,
                            created_at: Date.now()
                        }
                    ],
                    $slice: -100
                }
            }
        }
    )

    if (server.modules.reports.active && server.modules.reports.channel_id) {
        const channel = interaction.guild.channels.cache.get(server.modules.reports.channel_id) as BaseGuildTextChannel

        if (channel) {
            let reportMessages: Collection<string, Message>, reportMessage: Message

            try {
                reportMessages = await channel.messages.fetch({ limit: 50, cache: false })
                reportMessage = reportMessages?.find(i => {
                    return i.author.id === self.user.id && i.embeds[0]?.footer?.text?.startsWith(`ID: ${mention.id}`) && i.components.length
                })
            } catch (err) {}

            if (reportMessage) {
                const embed = new EmbedBuilder(reportMessage.embeds[0])
                const fields = embed.data.fields.length === 25 ? embed.data.fields.slice(1, 25) : embed.data.fields

                embed.setFields([
                    ...fields,
                    {
                        name: `${interaction.user.tag} <t:${Math.round(Date.now() / 1000)}:R>`,
                        value: reason
                    }
                ])

                try {
                    await reportMessage.edit({ embeds: [embed] })
                } catch (err) {
                    await self.logger.handleError({ module: 'ReportCommand', action: 'EditReportMessage', error: err, guild_id: interaction.guildId })
                }
            } else {
                const embed = new EmbedBuilder()
                    .setAuthor({ name: mention.user.tag, iconURL: mention.user.displayAvatarURL() })
                    .addFields([
                        {
                            name: `${interaction.user.tag} <t:${Math.round(Date.now() / 1000)}:R>`,
                            value: reason
                        }
                    ])
                    .setFooter({ text: `ID: ${mention.id}` })

                const selectMenuOptions = ['indefinitely', '10m', '30m', '1h', '2h', '5h', '12h', '1d', '3d', '7d', '14d'].map(i => {
                    return {
                        label:
                            i === 'indefinitely'
                                ? t('indefinitely').toLowerCase()
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
                            .setLabel(t('commands.report.quick_actions.KICK'))
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId(`R-WARN-${mention.id}`)
                            .setLabel(t('commands.report.quick_actions.WARN'))
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId(`R-SKIP-${mention.id}`)
                            .setLabel(t('commands.report.quick_actions.IGNORE'))
                            .setStyle(ButtonStyle.Secondary)
                    ),
                    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId(`R-BAN-${mention.id}`)
                            .setPlaceholder(t('commands.report.quick_actions.BAN'))
                            .setOptions(selectMenuOptions)
                    ),
                    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId(`R-MUTE-${mention.id}`)
                            .setPlaceholder(t('commands.report.quick_actions.MUTE'))
                            .setOptions(selectMenuOptions.slice(1))
                    )
                ]

                try {
                    await channel.send({ embeds: [embed], components: rows })
                } catch (err) {
                    await self.logger.handleError({ module: 'ReportCommand', action: 'SendReportMessage', error: err, guild_id: interaction.guildId })
                }
            }
        }
    }

    await interaction.editReply({
        content: `${self._emojis.OK} | ${t('commands.report.text_user_reported', { user: `**${(interaction.member as any).displayName}**` })}`
    })
    self.cache.delete(`REPORT-${mention.id}-${interaction.user.id}`)

    return true
}
