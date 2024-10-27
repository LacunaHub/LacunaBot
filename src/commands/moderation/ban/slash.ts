import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { ChatInputCommandInteraction, GuildMember } from 'discord.js'
import moment from 'moment'
import ms from 'ms'
import Lacuna from '../../../internals/Lacuna'
import TemporaryBan from '../../../internals/structures/TemporaryBan'
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
            content: `${self.staticEmojis.Cross} | ${t('Commands.BanCommand.Texts.InvalidUser', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (mention.id == interaction.member.id) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.BanCommand.Texts.YouCannotBanYourself', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (!mention.bannable) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.BanCommand.Texts.CannotBanThisUser', {
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

    if (server.moderation.deny_moderate_users_with_mp && mention.permissions.has(self.PermissionFlags.BanMembers)) {
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
        else if (duration > ms('2y')) duration = ms('2y')

        reason = `${reason} (${moment(Date.now() + duration)
            .locale(server.locale)
            .fromNow(true)})`
    }

    if (server.moderation.case_log.types.BAN_ADD.active) {
        const replacer = new Replacer(server.premium.available, { guild: interaction.guild, member: mention }),
            messagePayload = await replacer.replaceTemplateMessage(server.moderation.case_log.types.BAN_ADD.dm_message, { penalty: { reason } })

        try {
            await mention.send(messagePayload)
        } catch (err) {
            await self.logger.handleError({ module: 'BanCommand', action: 'SendDirectMessage', error: err, guild_id: interaction.guildId })
        }
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
        try {
            await interaction.guild.bans.create(mention.id, { reason: reason })
        } catch (err) {
            await self.logger.handleError({ module: 'BanCommand', action: 'Ban', error: err, guild_id: interaction.guildId })
        }
    }

    await createCaseLogEntry(interaction.guild, { type: 'BanAdd', target: mention.user, executor: interaction.user, reason })
    await interaction.editReply({
        content: `${self.staticEmojis.Check} | ${t('Commands.BanCommand.Texts.UserHasBeenBanned', {
            username: `**${interaction.member.displayName}**`,
            target: `**${mention.user.tag}**`
        })}`
    })

    return true
}
