import { CommandInteraction, MessageEmbed } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async (self: Lacuna, server: ServerDocument, interaction: CommandInteraction) => {
    const t = self.i18n.t.bind(null, server.locale)

    const server_owner = await interaction.guild.fetchOwner()

    const created_ts = Math.round(interaction.guild.createdTimestamp / 1000)

    const embed = new MessageEmbed()
        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
        .addField(t('commands.server.text_owner'), server_owner.user.tag, true)
        .addField(t('commands.server.text_guild_id'), interaction.guild.id, true)
        .addField(t('commands.server.text_total_members'), `${interaction.guild.memberCount}`, true)
        .addField(t('commands.server.text_total_channels'), `${interaction.guild.channels.cache.size}`, true)
        .addField(t('commands.server.text_verification_level'), t(`common.guild_verification_levels.${interaction.guild.verificationLevel}`), true)
        .addField(t('commands.server.text_afk_channel'), interaction.guild?.afkChannel?.name ?? '-', true)
        .addField(t('commands.server.text_roles'), `${interaction.guild.roles.cache.size}`, true)
        .addField(t('commands.server.text_emojis'), `${interaction.guild.emojis.cache.size}`, true)
        .addField('\u200B', '\u200B', true)
        .addField('\u200B', t('commands.server.text_guild_created_at', { date: `<t:${created_ts}:d> – <t:${created_ts}:R>` }))

    if (server.server.premium.available) embed.setDescription(`${self._emojis.DIAMOND} Diamond Subscription`)
    if (interaction.guild.description) embed.setDescription(embed.description ? `${embed.description}\n${interaction.guild.description}` : interaction.guild.description)

    await interaction.reply({ embeds: [embed] })

    return true
}
