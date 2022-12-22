import {
    ActionRowBuilder,
    BaseGuildTextChannel,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    Collection,
    EmbedBuilder,
    Message,
    StringSelectMenuBuilder
} from 'discord.js'
import moment from 'moment'
import ms from 'ms'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { truncateString } from '../../../internals/utility/Utils'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction) => {
    const t = self.i18n.t.bind(null, server.locale)

    if (!server.modules.reports.active || !server.modules.reports.channel_id) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.report.text_reports_disabled_or_no_channel', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    const channel = interaction.guild.channels.cache.get(server.modules.reports.channel_id) as BaseGuildTextChannel

    if (!channel) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.report.text_channel_not_found', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    const target_id = interaction.options?.getString(t('commands.report.options.message_id.name'))

    if (!target_id) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.report.text_no_message_id', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })
    const target = await interaction.channel.messages.fetch({ message: target_id }).catch(() => {})

    if (!target) {
        await interaction.editReply({
            content: `${self._emojis.ERROR} | ${t('commands.report.text_no_message', { user: `**${(interaction.member as any).displayName}**` })}`
        })

        return false
    }

    const entry = self.qdb.get(`reports.${target_id}`)
    if (!entry) self.qdb.set(`reports.${target_id}`, { timestamp: target.createdTimestamp, users: [] })

    if (entry?.users?.includes(interaction.user.id)) {
        await interaction.editReply({
            content: `${self._emojis.ERROR} | ${t('commands.report.text_already_reported', { user: `**${(interaction.member as any).displayName}**` })}`
        })

        return false
    }

    self.qdb.push(`reports.${target_id}.users`, interaction.user.id)

    const messages = (await channel.messages.fetch({ limit: 50, cache: false }).catch(() => {})) as Collection<string, Message>
    const report = messages?.find(m => m.author.id == self.user.id && m.embeds[0]?.footer?.text?.startsWith(`ID: ${target.id}`))

    if (!report) {
        const embed = new EmbedBuilder()
            .setAuthor({ name: target.author.tag, iconURL: target.author.displayAvatarURL() })
            .addFields([
                { name: t('commands.report.text_message_channel'), value: `<#${target.channelId}>`, inline: true },
                { name: t('commands.report.text_report_count'), value: '1', inline: true }
            ])
            .setFooter({ text: `ID: ${target.id}` })
            .setTimestamp(target.createdTimestamp)

        if (target.attachments.filter(file => Boolean(file.width)).size > 0) embed.setImage(target.attachments.first().proxyURL)
        if (target.content) embed.setDescription(`${truncateString(target.content, 768)}${target.embeds[0] ? `\n\`[${t('common.attachments')}]\`` : ''}`)

        const selectMenuOptions = ['indefinitely', '10m', '30m', '1h', '2h', '5h', '12h', '1d', '3d', '7d', '14d'].map(i => {
            return {
                label:
                    i == 'indefinitely'
                        ? t('indefinitely').toLowerCase()
                        : moment(Date.now() + ms(i))
                              .locale(server.locale)
                              .fromNow(true),
                value: i
            }
        })

        const rows = [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId(`R-KICK-${target.author.id}`).setLabel(t('commands.report.quick_actions.KICK')).setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId(`R-WARN-${target.author.id}`).setLabel(t('commands.report.quick_actions.WARN')).setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId(`R-SKIP-${target.author.id}`).setLabel(t('commands.report.quick_actions.IGNORE')).setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setLabel(t('commands.report.text_jump_to_message')).setStyle(ButtonStyle.Link).setURL(target.url)
            ),
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`R-BAN-${target.author.id}`)
                    .setPlaceholder(t('commands.report.quick_actions.BAN'))
                    .setOptions(selectMenuOptions)
            ),
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`R-MUTE-${target.author.id}`)
                    .setPlaceholder(t('commands.report.quick_actions.MUTE'))
                    .setOptions(selectMenuOptions.slice(1))
            )
        ]

        await channel.send({ embeds: [embed], components: rows }).catch(self.logger.error)
    } else {
        const embed = new EmbedBuilder(report.embeds[0])
        const count = embed.data.fields[1].value

        embed.data.fields[1].value = (Number(count) + 1).toString()

        await report.edit({ embeds: [embed] }).catch(self.logger.error)
    }

    await interaction.editReply({
        content: `${self._emojis.OK} | ${t('commands.report.text_report_confirm', { user: `**${(interaction.member as any).displayName}**` })}`
    })

    return true
}
