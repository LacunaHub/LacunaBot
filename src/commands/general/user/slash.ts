import { CommandInteraction, GuildMember, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async (self: Lacuna, server: ServerDocument, interaction: CommandInteraction) => {
    const t = self.i18n.t.bind(null, server.locale)

    const mention = (interaction.options?.getMember(t('commands.user.options.user.name')) || interaction.member) as GuildMember

    const name = mention.nickname ? `${mention.user.tag} — ${mention.nickname}` : mention.user.tag

    const created_ts = Math.round(mention.user.createdTimestamp / 1000)
    const joined_ts = Math.round(mention.joinedTimestamp / 1000)

    const embed = new MessageEmbed()
        .setAuthor({ name, iconURL: mention.user.displayAvatarURL() })
        .addField(t('commands.user.text_registration_date'), `<t:${created_ts}:d> – <t:${created_ts}:R>`, true)
        .addField(t('commands.user.text_join_date'), `<t:${joined_ts}:d> – <t:${joined_ts}:R>`, true)
        .addField(
            `${t('common.roles')} [${mention.roles.cache.filter(r => r.id != interaction.guild.id).size}]`,
            mention.roles.cache
                .filter(r => r.id != interaction.guild.id)
                .map(role => `<@&${role.id}>`)
                .join(' ') || '-'
        )
        .setFooter({ text: `ID: ${mention.id}` })

    const row = new MessageActionRow().addComponents(
        new MessageButton()
            .setStyle('LINK')
            .setLabel(t('commands.user.text_avatar_link'))
            .setURL(mention.user.displayAvatarURL({ size: 512, format: 'png' }))
    )

    await interaction.reply({ embeds: [embed], components: [row] })

    return true
}
