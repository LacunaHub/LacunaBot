import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { guildVerificationLevelNames } from '@/internals/utility/Constants.js'
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)

    const guildOwner = await interaction.guild.fetchOwner()
    const serverCreatedAt = Math.round(interaction.guild.createdTimestamp / 1000)

    const embed = new EmbedBuilder()
        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL()! })
        .addFields([
            { name: t('Commands.ServerCommand.Texts.GuildOwner'), value: guildOwner.user.tag, inline: true },
            { name: t('Commands.ServerCommand.Texts.GuildId'), value: interaction.guild.id, inline: true },
            {
                name: t('Commands.ServerCommand.Texts.MemberCount'),
                value: `${interaction.guild.memberCount}`,
                inline: true
            },
            {
                name: t('Commands.ServerCommand.Texts.ChannelCount'),
                value: `${interaction.guild.channels.cache.size}`,
                inline: true
            },
            {
                name: t('Commands.ServerCommand.Texts.GuildVerificationLevel'),
                value: t(
                    `Commands.ServerCommand.Texts.GuildVerificationLevels.${guildVerificationLevelNames[interaction.guild.verificationLevel]}`
                ),
                inline: true
            },
            {
                name: t('Commands.ServerCommand.Texts.GuildAFKChannel'),
                value: interaction.guild?.afkChannel?.name ?? '-',
                inline: true
            },
            {
                name: t('Commands.ServerCommand.Texts.RoleCount'),
                value: `${interaction.guild.roles.cache.size}`,
                inline: true
            },
            {
                name: t('Commands.ServerCommand.Texts.EmojiCount'),
                value: `${interaction.guild.emojis.cache.size}`,
                inline: true
            },
            { name: '\u200B', value: '\u200B', inline: true },
            {
                name: '\u200B',
                value: t('Commands.ServerCommand.Texts.GuildDateOfCreation', {
                    relativeTime: `<t:${serverCreatedAt}:R>`
                })
            }
        ])

    if (interaction.guild.description) {
        embed.setDescription(
            embed.data.description
                ? `${embed.data.description}\n${interaction.guild.description}`
                : interaction.guild.description
        )
    }

    const imageURL =
        interaction.guild.bannerURL({ size: 512 }) ??
        interaction.guild.discoverySplashURL({ size: 512 }) ??
        interaction.guild.splashURL({ size: 512 })

    if (imageURL) {
        embed.setImage(imageURL)
    }

    await interaction.reply({ embeds: [embed] })

    return true
}
