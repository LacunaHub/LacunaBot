import { BaseGuildTextChannel, Message, MessageEmbed } from 'discord.js'
import ms from 'ms'
import moment from 'moment'
import { images } from '../../../modules/Logs'
import TemporaryBan from '../../../internals/structures/TemporaryBan'
import Replacer from '../../../modules/Replacer'
import Lacuna from '../../../internals/Lacuna'
import { ServerDocument } from '../../../database/schemas/Servers'

export default async (self: Lacuna, server: ServerDocument, message: Message) => {
    const locale = self.translator.locale(server.locale).commands

    const mention = message.mentions.members.first() || (message['args'][0] ? (await message.guild.members.fetch(message['args'][0])) : null)
    let duration = message['args'][1]

    duration = duration && ms(duration) ? ms(duration) : null

    let reason = message['args'].slice(duration ? 2 : 1).join(' ') || '-'

    if (!mention) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.user_not_found, `**${message.member.displayName}**`)}` })

        return false
    }

    if (!mention.bannable) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.cant_ban_user, `**${message.member.displayName}**`)}` })

        return false
    }

    if (mention.id == message.member.id) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.self_action, `**${message.member.displayName}**`)}` })

        return false
    }

    const case_log = message.guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel
    const case_id: number = server.moderation.case_log.cases.length + 1

    if (duration) {
        if (duration < ms('1m')) duration = ms('1m')
        else if (duration > ms('2y')) duration = ms('2y')

        reason = `${reason} (${moment(Date.now() + duration).locale(server.locale).fromNow(true)})`
    }

    const case_log_message = new MessageEmbed()
        .setAuthor({ name: locale.common.case_log.cases.BAN_ADD, iconURL: images.BAN_ADD })
        .addField(locale.common.case_log.target, `${mention.user.tag}\n(${mention.id})`, true)
        .addField(locale.common.case_log.executor, message.member.user.tag, true)
        .addField(locale.common.case_log.reason, reason)
        .setFooter(self.translator.format(locale.common.case_log.case, case_id))
        .setTimestamp()
        .setColor('#EF5350')

    if (server.moderation.case_log.case_types_messages.BAN_ADD.active) {
        const replacer = new Replacer(null, { guild: message.guild, member: mention, message, penalty: { reason } })
        const dm_message = await replacer.replaceTemplateMessage(server.moderation.case_log.case_types_messages.BAN_ADD.dm_message)

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
    }

    else {
        await message.guild.members.ban(mention, { reason: reason }).catch(self.logger.error)
    }

    if (case_log && server.moderation.case_log.case_types.BAN_ADD) {
        await case_log.send({ embeds: [case_log_message] }).catch(self.logger.error)
    
        await self.db.servers.updateOne({ _id: message.guild.id }, {
            $push: {
                'moderation.case_log.cases': {
                    case_id: case_id,
                    type: 1 << 0,
                    timestamp: Date.now(),
                    reason: reason,
                    target: {
                        id: mention.id,
                        name: mention.user.tag
                    },
                    executor: {
                        id: message.member.id,
                        name: message.member.user.tag
                    }
                }
            }
        })
    }

    await message.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.ban.texts.user_banned, `**${message.member.displayName}**`, `**${mention.user.tag}**`)}` })

    return true
}