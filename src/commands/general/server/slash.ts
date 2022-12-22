import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction) => {
    const t = self.i18n.t.bind(null, server.locale)

    const server_owner = await interaction.guild.fetchOwner()

    const created_ts = Math.round(interaction.guild.createdTimestamp / 1000)

    const embed = new EmbedBuilder().setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() }).addFields([
        { name: t('commands.server.text_owner'), value: server_owner.user.tag, inline: true },
        { name: t('commands.server.text_guild_id'), value: interaction.guild.id, inline: true },
        { name: t('commands.server.text_total_members'), value: `${interaction.guild.memberCount}`, inline: true },
        { name: t('commands.server.text_total_channels'), value: `${interaction.guild.channels.cache.size}`, inline: true },
        { name: t('commands.server.text_verification_level'), value: t(`common.guild_verification_levels.${interaction.guild.verificationLevel}`), inline: true },
        { name: t('commands.server.text_afk_channel'), value: interaction.guild?.afkChannel?.name ?? '-', inline: true },
        { name: t('commands.server.text_roles'), value: `${interaction.guild.roles.cache.size}`, inline: true },
        { name: t('commands.server.text_emojis'), value: `${interaction.guild.emojis.cache.size}`, inline: true },
        { name: '\u200B', value: '\u200B', inline: true },
        { name: '\u200B', value: t('commands.server.text_guild_created_at', { date: `<t:${created_ts}:d> – <t:${created_ts}:R>` }) }
    ])

    if (server.server.premium.available) embed.setDescription(`${self._emojis.DIAMOND} Diamond Subscription`)
    if (interaction.guild.description)
        embed.setDescription(embed.data.description ? `${embed.data.description}\n${interaction.guild.description}` : interaction.guild.description)

    await interaction.reply({ embeds: [embed] })

    return true
}
