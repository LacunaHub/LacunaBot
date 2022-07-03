import { Message } from 'discord.js'
import moment from 'moment'
import ms from 'ms'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import TemporaryBan from '../../../internals/structures/TemporaryBan'
import { caseLog } from '../../../modules/Moderation'
import Replacer from '../../../modules/Replacer'

export default async (self: Lacuna, server: ServerDocument, message: Message) => {
    const locale = self.translator.locale(server.locale).commands

    const mention = message.mentions.members.first() || (message['args'][0] ? await message.guild.members.fetch(message['args'][0]) : null)
    let duration = message['args'][1]

    duration = duration && ms(duration) ? ms(duration) : null

    let reason = message['args'].slice(duration ? 2 : 1).join(' ') || '-'

    if (!mention) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.user_not_found, `**${message.member.displayName}**`)}` })

        return false
    }

    if (mention.id == message.member.id) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.self_action, `**${message.member.displayName}**`)}` })

        return false
    }

    if (!mention.bannable) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.cant_ban_user, `**${message.member.displayName}**`)}` })

        return false
    }

    if (server.moderation.respect_hierarchy && mention.roles.highest.position > message.member.roles.highest.position) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.user_is_higher, `**${message.member.displayName}**`)}` })

        return false
    }

    if (server.moderation.deny_moderate_users_with_mp && mention.permissions.has(self.PERMISSIONS_FLAGS.BAN_MEMBERS)) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.user_is_moderator, `**${message.member.displayName}**`)}` })

        return false
    }

    if (mention.roles.cache.some(i => server.moderation.unmoderated_roles.includes(i.id))) {
        await message.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.user_has_unmoderated_roles, `**${message.member.displayName}**`)}`
        })

        return false
    }

    if (duration) {
        if (duration < ms('1m')) duration = ms('1m')
        else if (duration > ms('2y')) duration = ms('2y')

        reason = `${reason} (${moment(Date.now() + duration)
            .locale(server.locale)
            .fromNow(true)})`
    }

    if (server.moderation.case_log.types.BAN_ADD.active) {
        const replacer = new Replacer(null, { guild: message.guild, member: mention, message, penalty: { reason } })
        const dm_message = await replacer.replaceTemplateMessage(server.moderation.case_log.types.BAN_ADD.dm_message)

        await mention.send(dm_message).catch(self.logger.error)
    }

    if (duration) {
        new TemporaryBan(self, {
            user_id: mention.id,
            guild_id: message.guild.id,
            expires_timestamp: Date.now() + duration,
            reason: reason,
            initial: true
        })
    } else {
        await message.guild.members.ban(mention, { reason: reason }).catch(self.logger.error)
    }

    await caseLog.createCaseEntry(server, message.guild, { type: 'BAN_ADD', target: mention.user, executor: message.author, reason })

    await message.reply({
        content: `${self._emojis.OK} | ${self.translator.format(locale.ban.texts.user_banned, `**${message.member.displayName}**`, `**${mention.user.tag}**`)}`
    })

    return true
}
