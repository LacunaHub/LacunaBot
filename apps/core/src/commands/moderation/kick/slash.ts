import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { DirectMessages } from '@/modules/DirectMessages.js'
import { createCaseLogEntry } from '@/modules/Moderation/CaseLog.js'
import Replacer from '@/modules/Replacer.js'
import { ChatInputCommandInteraction, GuildMember } from 'discord.js'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)

    const mention = interaction.options?.getMember('user') as GuildMember
    const reason = interaction.options?.getString('reason') ?? '-'

    if (!mention) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.KickCommand.Texts.InvalidUser', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (mention.id === interaction.member.id) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.KickCommand.Texts.YouCannotKickYourself', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (!mention.kickable) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.KickCommand.Texts.CannotKickThisUser', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (
        server.moderation.respect_hierarchy &&
        mention.roles.highest.position > interaction.member.roles.highest.position
    ) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.BanCommand.Texts.UserRoleIsHigherThanYour', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (server.moderation.deny_moderate_users_with_mp && mention.permissions.has(self.PermissionFlags.KickMembers)) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.BanCommand.Texts.UserIsModerator', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (mention.roles.cache.some(i => server.moderation.unmoderated_roles.includes(i.id))) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.BanCommand.Texts.UserHasUnmoderatedRoles', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })

    if (server.moderation.case_log.types.KICK.active) {
        const replacer = new Replacer(server.premium.available, { guild: interaction.guild, member: mention }),
            messagePayload = await replacer.replaceTemplateMessage(server.moderation.case_log.types.KICK.dm_message, {
                penalty: { reason }
            })

        try {
            await DirectMessages.send(self, mention, messagePayload)
        } catch (err) {
            self.logger.error({ module: 'KickCommand', action: 'SendDirectMessage', err, guildId: interaction.guildId })
        }
    }

    try {
        await mention.kick(reason)
    } catch (err) {
        self.logger.error({ module: 'KickCommand', action: 'Kick', err, guildId: interaction.guildId })
    }

    await createCaseLogEntry(interaction.guild, {
        type: 'Kick',
        target: mention.user,
        executor: interaction.user,
        reason
    })
    await interaction.editReply({
        content: `${self.staticEmojis.Check} | ${t('Commands.KickCommand.Texts.UserHasBeenKicked', {
            username: `**${interaction.member.displayName}**`,
            target: `**${mention.user.tag}**`
        })}`
    })

    return true
}
