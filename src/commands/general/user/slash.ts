import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, GuildMember } from 'discord.js'
import ms from 'ms'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction) => {
    const t = self.i18n.t.bind(null, server.locale)

    const mention = (interaction.options?.getMember('user') || interaction.member) as GuildMember
    const user = await self.db.users.findOne({ _id: mention.id })

    const name = mention.nickname ? `${mention.user.tag} — ${mention.nickname}` : mention.user.tag
    const created_ts = Math.round(mention.user.createdTimestamp / 1000)
    const joined_ts = Math.round(mention.joinedTimestamp / 1000)

    await mention.user.fetch()

    const embed = new EmbedBuilder()
        .setAuthor({ name, iconURL: mention.user.displayAvatarURL() })
        .addFields([
            { name: t('commands.user.text_registration_date'), value: `<t:${created_ts}:R>`, inline: true },
            { name: t('commands.user.text_join_date'), value: `<t:${joined_ts}:R>`, inline: true },
            {
                name: `${t('common.roles')} [${mention.roles.cache.filter(r => r.id != interaction.guild.id).size}]`,
                value:
                    mention.roles.cache
                        .filter(r => r.id != interaction.guild.id)
                        .map(role => `<@&${role.id}>`)
                        .join(' ') || '-'
            }
        ])
        .setFooter({ text: `ID: ${mention.id}` })

    if (user?.reports?.length) {
        const last24h = user.reports.filter(i => Date.now() - i.created_at < ms('24h')),
            last7d = user.reports.filter(i => Date.now() - i.created_at < ms('7d')),
            last5Reports = user.reports.slice(Math.max(user.reports.length - 10, 0)).sort((a, b) => b.created_at - a.created_at)

        embed.addFields([
            {
                name: t('commands.report.text_recent_reports'),
                value: `
                    **${t('commands.report.text_total_reports')}**: ${user.reports.length}
                    **${t('commands.violations.text_last_24_hours')}**: ${last24h.length}
                    **${t('commands.violations.text_last_7_days')}**: ${last7d.length}
                `
            },
            ...last5Reports.map(i => {
                return {
                    name: `<t:${Math.round(i.created_at / 1000)}:R>`,
                    value: i.reason
                }
            })
        ])
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel(t('commands.user.text_avatar_link'))
            .setURL(mention.user.displayAvatarURL({ size: 512 }))
    )

    if (mention.user.banner) {
        embed.setImage(mention.user.bannerURL({ size: 512 }))
        row.addComponents(
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel(t('commands.user.text_banner_link'))
                .setURL(mention.user.bannerURL({ size: 1024 }))
        )
    }

    await interaction.reply({ embeds: [embed], components: [row] })

    return true
}
