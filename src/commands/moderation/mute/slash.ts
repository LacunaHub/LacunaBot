import { CommandInteraction, GuildMember } from 'discord.js'
import moment from 'moment'
import ms from 'ms'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { caseLog } from '../../../modules/Moderation'
import Replacer from '../../../modules/Replacer'

export default async (self: Lacuna, server: ServerDocument, interaction: CommandInteraction) => {
    const t = self.i18n.t.bind(null, server.locale)

    const mention = interaction.options?.getMember(t('commands.mute.options.user.name')) as GuildMember
    let duration = interaction.options?.getString(t('commands.mute.options.duration.name')) as any
    let reason = interaction.options?.getString(t('commands.mute.options.reason.name')) ?? '-'

    duration = duration && ms(duration) ? ms(duration) : null

    if (!mention) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.mute.text_user_not_found', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (mention.id == interaction.user.id) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.mute.text_self_action', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (!mention.manageable) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.mute.text_cant_mute_user', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (server.moderation.respect_hierarchy && mention.roles.highest.position > (interaction.member as any).roles.highest.position) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_is_higher', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (server.moderation.deny_moderate_users_with_mp && mention.permissions.has(self.PERMISSIONS_FLAGS.MODERATE_MEMBERS)) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_is_moderator', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (mention.roles.cache.some(i => server.moderation.unmoderated_roles.includes(i.id))) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_has_unmoderated_roles', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

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

    await mention.disableCommunicationUntil(Date.now() + duration, reason).catch(() => {})

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

        await mention.roles.set(strict_roles, reason).catch(self.logger.error)
    }

    if (server.moderation.case_log.types.MUTE_ADD.active) {
        const replacer = new Replacer(null, { guild: interaction.guild, member: mention, penalty: { reason } })
        const dm_message = await replacer.replaceTemplateMessage(server.moderation.case_log.types.MUTE_ADD.dm_message)

        await mention.send(dm_message).catch(self.logger.error)
    }

    await caseLog.createCaseEntry(server, interaction.guild, { type: 'MUTE_ADD', target: mention.user, executor: interaction.user, reason })

    await interaction.reply({
        content: `${self._emojis.OK} | ${t('commands.mute.text_user_muted', {
            user: `**${(interaction.member as any).displayName}**`,
            target: `**${mention.user.tag}**`
        })}`,
        ephemeral: true
    })

    return true
}
