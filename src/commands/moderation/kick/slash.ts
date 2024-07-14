import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { ChatInputCommandInteraction, GuildMember } from 'discord.js'
import Lacuna from '../../../internals/Lacuna'
import { createCaseLogEntry } from '../../../modules/Moderation/CaseLog'
import Replacer from '../../../modules/Replacer'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)

    const mention = interaction.options?.getMember('user') as GuildMember
    const reason = interaction.options?.getString('reason') ?? '-'

    if (!mention) {
        await interaction.reply({
            content: `${self.staticEmojis.ERROR} | ${t('Commands.KickCommand.Texts.InvalidUser', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (mention.id === interaction.member.id) {
        await interaction.reply({
            content: `${self.staticEmojis.ERROR} | ${t('Commands.KickCommand.Texts.YouCannotKickYourself', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (!mention.kickable) {
        await interaction.reply({
            content: `${self.staticEmojis.ERROR} | ${t('Commands.KickCommand.Texts.CannotKickThisUser', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (server.moderation.respect_hierarchy && mention.roles.highest.position > interaction.member.roles.highest.position) {
        await interaction.reply({
            content: `${self.staticEmojis.ERROR} | ${t('Commands.BanCommand.Texts.UserRoleIsHigherThanYour', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (server.moderation.deny_moderate_users_with_mp && mention.permissions.has(self.PermissionFlags.KickMembers)) {
        await interaction.reply({
            content: `${self.staticEmojis.ERROR} | ${t('Commands.BanCommand.Texts.UserIsModerator', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (mention.roles.cache.some(i => server.moderation.unmoderated_roles.includes(i.id))) {
        await interaction.reply({
            content: `${self.staticEmojis.ERROR} | ${t('Commands.BanCommand.Texts.UserHasUnmoderatedRoles', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })

    if (server.moderation.case_log.types.KICK.active) {
        const replacer = new Replacer(server.premium.available, { guild: interaction.guild, member: mention }),
            messagePayload = await replacer.replaceTemplateMessage(server.moderation.case_log.types.KICK.dm_message, { penalty: { reason } })

        try {
            await mention.send(messagePayload)
        } catch (err) {
            await self.logger.handleError({ module: 'KickCommand', action: 'SendDirectMessage', error: err, guild_id: interaction.guildId })
        }
    }

    try {
        await mention.kick(reason)
    } catch (err) {
        await self.logger.handleError({ module: 'KickCommand', action: 'Kick', error: err, guild_id: interaction.guildId })
    }

    await createCaseLogEntry(interaction.guild, { type: 'Kick', target: mention.user, executor: interaction.user, reason })
    await interaction.editReply({
        content: `${self.staticEmojis.OK} | ${t('Commands.KickCommand.Texts.UserHasBeenKicked', {
            username: `**${interaction.member.displayName}**`,
            target: `**${mention.user.tag}**`
        })}`
    })

    return true
}
