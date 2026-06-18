import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { createCaseLogEntry } from '@/modules/Moderation/CaseLog.js'
import { ChatInputCommandInteraction, GuildBan } from 'discord.js'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)

    const userId = interaction.options?.getString('user-id')
    const reason = interaction.options?.getString('reason') ?? '-'

    if (!userId) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.UnbanCommand.Texts.InvalidUser', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })

    let userBan!: GuildBan

    try {
        userBan = await interaction.guild.bans.fetch({ user: userId })
    } catch (err) {}

    if (!userBan) {
        await interaction.editReply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.UnbanCommand.Texts.BanNotFound', {
                username: `**${interaction.member.displayName}**`
            })}`
        })

        return false
    }

    const tempBan = self.tempbans.get(`${interaction.guildId}:${userId}`)

    if (tempBan) {
        await tempBan.delete(false, reason)
    } else {
        await interaction.guild.bans.remove(userId, reason)
    }

    await createCaseLogEntry(interaction.guild, {
        type: 'BanRemove',
        target: userBan.user,
        executor: interaction.user,
        reason
    })
    await interaction.editReply({
        content: `${self.staticEmojis.Check} | ${t('Commands.UnbanCommand.Texts.UserHasBeenUnbanned', {
            username: `**${interaction.member.displayName}**`,
            target: `**${userBan.user.tag}**`
        })}`
    })

    return true
}
