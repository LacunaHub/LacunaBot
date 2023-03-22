import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, GuildMember } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction) => {
    const t = self.i18n.t.bind(null, server.locale)

    const mention = (interaction.options?.getMember(self.i18n.t('en', 'commands.user.options.user.name')) || interaction.member) as GuildMember

    const name = mention.nickname ? `${mention.user.tag} — ${mention.nickname}` : mention.user.tag

    const created_ts = Math.round(mention.user.createdTimestamp / 1000)
    const joined_ts = Math.round(mention.joinedTimestamp / 1000)

    const embed = new EmbedBuilder()
        .setAuthor({ name, iconURL: mention.user.displayAvatarURL() })
        .addFields([
            { name: t('commands.user.text_registration_date'), value: `<t:${created_ts}:d> – <t:${created_ts}:R>`, inline: true },
            { name: t('commands.user.text_join_date'), value: `<t:${joined_ts}:d> – <t:${joined_ts}:R>`, inline: true },
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

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel(t('commands.user.text_avatar_link'))
            .setURL(mention.user.displayAvatarURL({ size: 512, extension: 'png' }))
    )

    await interaction.reply({ embeds: [embed], components: [row] })

    return true
}
