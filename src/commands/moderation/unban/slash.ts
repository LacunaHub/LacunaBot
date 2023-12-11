import { ChatInputCommandInteraction, GuildBan } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { caseLog } from '../../../modules/Moderation'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)

    const userId = interaction.options?.getString('user-id')
    const reason = interaction.options?.getString('reason') ?? '-'

    if (!userId) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('Commands.UnbanCommand.Texts.InvalidUser', { username: `**${interaction.member.displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })

    let userBan: GuildBan

    try {
        userBan = await interaction.guild.bans.fetch({ user: userId })
    } catch (err) {}

    if (!userBan) {
        await interaction.editReply({
            content: `${self._emojis.ERROR} | ${t('Commands.UnbanCommand.Texts.BanNotFound', {
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

    await caseLog.createCaseEntry(interaction.guild, { type: 'BAN_REMOVE', target: userBan.user, executor: interaction.user, reason })
    await interaction.editReply({
        content: `${self._emojis.OK} | ${t('Commands.UnbanCommand.Texts.UserHasBeenUnbanned', {
            username: `**${interaction.member.displayName}**`,
            target: `**${userBan.user.tag}**`
        })}`
    })

    return true
}
