import { ServerDocument } from '@/database/schemas/Servers'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, GuildMember } from 'discord.js'
import Lacuna from '../../../internals/Lacuna'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)

    const mentionedUser = interaction.options?.getUser('user') || interaction.user
    let member: GuildMember

    try {
        member = await interaction.guild.members.fetch({ user: mentionedUser.id })
    } catch (err) {}

    const name = member?.nickname ? `${mentionedUser.tag} — ${member.nickname}` : mentionedUser.tag
    const createdAt = Math.round(mentionedUser.createdTimestamp / 1000),
        joinedAt = member ? Math.round(member.joinedTimestamp / 1000) : null

    await mentionedUser.fetch()

    const embed = new EmbedBuilder()
        .setAuthor({ name, iconURL: mentionedUser.displayAvatarURL() })
        .addFields([
            { name: t('Commands.UserCommand.Texts.AccountRegistrationDate'), value: `<t:${createdAt}:R>`, inline: true },
            { name: t('Commands.UserCommand.Texts.DateOfJoiningServer'), value: joinedAt ? `<t:${joinedAt}:R>` : '-', inline: true },
            {
                name: `${t('Common.Roles')} [${member?.roles?.cache?.filter(v => v.id !== interaction.guildId)?.size ?? 0}]`,
                value:
                    member?.roles?.cache
                        ?.filter(v => v.id !== interaction.guildId)
                        ?.map(role => `<@&${role.id}>`)
                        ?.join(' ') || '-'
            }
        ])
        .setFooter({ text: `UID: ${mentionedUser.id}` })

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel(t('Commands.UserCommand.Texts.LinkToAvatar'))
            .setURL(mentionedUser.displayAvatarURL({ size: 512 }))
    )

    if (mentionedUser.banner) {
        embed.setImage(mentionedUser.bannerURL({ size: 512 }))
        row.addComponents(
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel(t('Commands.UserCommand.Texts.LinkToBanner'))
                .setURL(mentionedUser.bannerURL({ size: 1024 }))
        )
    }

    await interaction.reply({ embeds: [embed], components: [row] })

    return true
}
