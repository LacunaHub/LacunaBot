import { ChatInputCommandInteraction, GuildMember } from 'discord.js'
import moment from 'moment'
import ms from 'ms'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import TemporaryBan from '../../../internals/structures/TemporaryBan'
import { caseLog } from '../../../modules/Moderation'
import Replacer from '../../../modules/Replacer'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction) => {
    const t = self.i18n.t.bind(null, server.locale)

    const mention = interaction.options?.getMember(self.i18n.t(interaction.locale, 'commands.ban.options.user.name')) as GuildMember
    let duration = interaction.options?.getString(self.i18n.t(interaction.locale, 'commands.ban.options.duration.name')) as any
    let reason = interaction.options?.getString(self.i18n.t(interaction.locale, 'commands.ban.options.reason.name')) ?? '-'

    duration = duration && ms(duration) ? ms(duration) : null

    if (!mention) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_not_found', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (mention.id == (interaction.member as any).id) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_self_action', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (!mention.bannable) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_cant_ban_user', { user: `**${(interaction.member as any).displayName}**` })}`,
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

    if (server.moderation.deny_moderate_users_with_mp && mention.permissions.has(self.PermissionFlags.BanMembers)) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_is_moderator', {
                user: `**${(interaction.member as any).displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (mention.roles.cache.some(i => server.moderation.unmoderated_roles.includes(i.id))) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_has_unmoderated_roles', {
                user: `**${(interaction.member as any).displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })

    if (duration) {
        if (duration < ms('1m')) duration = ms('1m')
        else if (duration > ms('2y')) duration = ms('2y')

        reason = `${reason} (${moment(Date.now() + duration)
            .locale(server.locale)
            .fromNow(true)})`
    }

    if (server.moderation.case_log.types.BAN_ADD.active) {
        const replacer = new Replacer(null, { guild: interaction.guild, member: mention, penalty: { reason } })
        const dm_message = await replacer.replaceTemplateMessage(server.moderation.case_log.types.BAN_ADD.dm_message)

        await mention.send(dm_message).catch(self.logger.error)
    }

    if (duration) {
        new TemporaryBan(self, {
            user_id: mention.id,
            guild_id: interaction.guild.id,
            expires_timestamp: Date.now() + duration,
            reason: reason,
            initial: true
        })
    } else {
        await interaction.guild.members.ban(mention, { reason: reason }).catch(self.logger.error)
    }

    await caseLog.createCaseEntry(interaction.guild, { type: 'BAN_ADD', target: mention.user, executor: interaction.user, reason })

    await interaction.editReply({
        content: `${self._emojis.OK} | ${t('commands.ban.text_user_banned', {
            user: `**${(interaction.member as any).displayName}**`,
            target: `**${mention.user.tag}**`
        })}`
    })

    return true
}
