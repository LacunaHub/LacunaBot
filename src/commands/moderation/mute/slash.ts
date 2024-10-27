import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { ChatInputCommandInteraction, GuildMember } from 'discord.js'
import moment from 'moment'
import ms from 'ms'
import Lacuna from '../../../internals/Lacuna'
import { createCaseLogEntry } from '../../../modules/Moderation/CaseLog'
import Replacer from '../../../modules/Replacer'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)

    const mention = interaction.options?.getMember('user') as GuildMember
    let duration = interaction.options?.getString('duration') as any
    let reason = interaction.options?.getString('reason') ?? '-'

    duration = duration && ms(duration) ? ms(duration) : null

    if (!mention) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.MuteCommand.Texts.InvalidUser', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (mention.id == interaction.user.id) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.MuteCommand.Texts.YouCannotMuteYourself', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (!mention.manageable) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.MuteCommand.Texts.CannotMuteThisUser', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (server.moderation.respect_hierarchy && mention.roles.highest.position > interaction.member.roles.highest.position) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.BanCommand.Texts.UserRoleIsHigherThanYour', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (server.moderation.deny_moderate_users_with_mp && mention.permissions.has(self.PermissionFlags.ModerateMembers)) {
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

    if (duration) {
        if (duration < ms('1m')) duration = ms('1m')
        else if (duration > ms('28d')) duration = ms('28d')

        reason = `${reason} (${moment(Date.now() + duration)
            .locale(server.locale)
            .fromNow(true)})`
    } else {
        duration = ms('1h')
        reason = `${reason} (${moment(Date.now() + duration)
            .locale(server.locale)
            .fromNow(true)})`
    }

    try {
        await mention.disableCommunicationUntil(Date.now() + duration, reason)
    } catch (err) {
        await self.logger.handleError({ module: 'MuteCommand', action: 'DisableCommunication', error: err, guild_id: interaction.guildId })
    }

    if (server.moderation.mutes.rar) {
        const current_roles = mention.roles.cache.filter(r => r.editable && r.id != interaction.guildId).map(r => r.id)

        await self.db.servers.updateOne(
            { _id: interaction.guildId },
            {
                $push: {
                    'moderation.mutes.rar_data': {
                        user_id: mention.id,
                        roles: current_roles
                    }
                }
            }
        )

        const strict_roles: string[] = [
            ...server.moderation.mutes.rar_strict.filter(r => current_roles.includes(r)),
            ...mention.roles.cache.filter(r => !r.editable).map(r => r.id)
        ]

        try {
            await mention.roles.set(strict_roles, reason)
        } catch (err) {
            await self.logger.handleError({ module: 'MuteCommand', action: 'RemoveAllRoles', error: err, guild_id: interaction.guildId })
        }
    }

    if (server.moderation.case_log.types.MUTE_ADD.active) {
        const replacer = new Replacer(server.premium.available, { guild: interaction.guild, member: mention }),
            messagePayload = await replacer.replaceTemplateMessage(server.moderation.case_log.types.MUTE_ADD.dm_message, { penalty: { reason } })

        try {
            await mention.send(messagePayload)
        } catch (err) {
            await self.logger.handleError({ module: 'MuteCommand', action: 'SendDirectMessage', error: err, guild_id: interaction.guildId })
        }
    }

    await createCaseLogEntry(interaction.guild, { type: 'MuteAdd', target: mention.user, executor: interaction.user, reason })
    await interaction.editReply({
        content: `${self.staticEmojis.Check} | ${t('Commands.MuteCommand.Texts.UserHasBeenMuted', {
            username: `**${interaction.member.displayName}**`,
            target: `**${mention.user.tag}**`
        })}`
    })

    return true
}
