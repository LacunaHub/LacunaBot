import { CommandInteraction, MessageEmbed } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async (self: Lacuna, server: ServerDocument, interaction: CommandInteraction) => {
    const locale = self.translator.locale(server.locale).commands

    const server_owner = await interaction.guild.fetchOwner()

    const created_ts = Math.round(interaction.guild.createdTimestamp / 1000)

    const embed = new MessageEmbed()
        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
        .addField(locale.server.texts.owner, server_owner.user.tag, true)
        .addField(locale.server.texts.id, interaction.guild.id, true)
        .addField(locale.server.texts.members.title, `${interaction.guild.memberCount} ${locale.server.texts.members.total}`, true)
        .addField(
            locale.server.texts.channels.title,
            `${interaction.guild.channels.cache.filter(c => c.type == 'GUILD_TEXT').size} ${locale.server.texts.channels.text}\n` +
                `${interaction.guild.channels.cache.filter(c => c.type == 'GUILD_VOICE').size} ${locale.server.texts.channels.voice}`,
            true
        )
        .addField(locale.server.texts.verification_level, locale.server.texts.verification_levels[interaction.guild.verificationLevel], true)
        .addField(locale.server.texts.afk_channel, interaction.guild?.afkChannel?.name ?? '-', true)
        .addField(locale.server.texts.roles, `${interaction.guild.roles.cache.size}`, true)
        .addField(locale.server.texts.emojis, `${interaction.guild.emojis.cache.size}`, true)
        .addField('\u200B', '\u200B', true)
        .addField('\u200B', `${locale.server.texts.footer.server_created} <t:${created_ts}:d> – <t:${created_ts}:R>`)

    if (server.server.premium.available) embed.setDescription(`${self._emojis.DIAMOND} ${locale.server.texts.diamomded}`)
    if (interaction.guild.description) embed.setDescription(embed.description ? `${embed.description}\n${interaction.guild.description}` : interaction.guild.description)

    await interaction.reply({ embeds: [embed] })

    return true
}
