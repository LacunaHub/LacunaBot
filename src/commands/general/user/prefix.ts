import { Message, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async (self: Lacuna, server: ServerDocument, message: Message) => {
    const locale = self.translator.locale(server.locale).commands

    const mention = message.mentions.members.first() || (message['args'][0] ? await message.guild.members.fetch(message['args'][0]) : null) || message.member

    const name = mention.nickname ? `${mention.user.tag} — ${mention.nickname}` : mention.user.tag

    const created_ts = Math.round(mention.user.createdTimestamp / 1000)
    const joined_ts = Math.round(mention.joinedTimestamp / 1000)

    const embed = new MessageEmbed()
        .setAuthor({ name, iconURL: mention.user.displayAvatarURL() })
        .addField(locale.user.texts.account_created, `<t:${created_ts}:d> – <t:${created_ts}:R>`, true)
        .addField(locale.user.texts.member_joined, `<t:${joined_ts}:d> – <t:${joined_ts}:R>`, true)
        .addField(
            `${locale.user.texts.roles} [${mention.roles.cache.filter(r => r.id != message.guild.id).size}]`,
            mention.roles.cache
                .filter(r => r.id != message.guild.id)
                .map(role => `<@&${role.id}>`)
                .join(' ') || '-'
        )
        .setFooter({ text: `ID: ${mention.id}` })

    const row = new MessageActionRow().addComponents(
        new MessageButton()
            .setStyle('LINK')
            .setLabel(locale.user.texts.avatar_link)
            .setURL(mention.user.displayAvatarURL({ size: 512, format: 'png' }))
    )

    await message.reply({ embeds: [embed], components: [row] })

    return true
}
