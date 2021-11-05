const { MessageEmbed } = require('discord.js')
const ms = require('ms')
const moment = require('moment')
const { images } = require('../../../modules/Logs')
const TemporaryBan = require('../../../internals/structures/TemporaryBan')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 */
module.exports = async (self, server, message) => {
    const locale = self.translator.locale(server.locale).commands

    const mention = message.mentions.members.first() || (message.args[0] ? (await message.guild.members.fetch(message.args[0])) : null)
    let duration = message.args[1]

    duration = duration && ms(duration) ? ms(duration) : null

    let reason = message.args.slice(duration ? 2 : 1).join(' ') || '-'

    if (!mention) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.user_not_found, `**${message.member.displayName}**`)}` })

        return false
    }

    if (!mention.bannable) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.cant_ban_user, `**${message.member.displayName}**`)}` })

        return false
    }

    const case_log = message.guild.channels.cache.get(server.moderation.case_log.channel_id)
    const case_id = server.moderation.case_log.cases.length + 1

    if (duration) {
        if (duration < ms('1m')) duration = ms('1m')
        else if (duration > ms('2y')) duration = ms('2y')

        reason = `${reason} (${moment(Date.now() + duration).locale(server.locale).endOf().fromNow(true)})`
    }

    const dm_message = new MessageEmbed()
        .setAuthor(locale.common.case_log.cases.BAN_ADD, images.BAN_ADD)
        .addField(locale.common.case_log.server, message.guild.name, true)
        .addField(locale.common.case_log.reason, reason, true)
        .setTimestamp()
        .setColor('#EF5350')

    const case_log_message = new MessageEmbed()
        .setAuthor(locale.common.case_log.cases.BAN_ADD, images.BAN_ADD)
        .addField(locale.common.case_log.target, `${mention.user.tag}\n(${mention.id})`, true)
        .addField(locale.common.case_log.executor, message.member.user.tag, true)
        .addField(locale.common.case_log.reason, reason)
        .setFooter(self.translator.format(locale.common.case_log.case, case_id))
        .setTimestamp()
        .setColor('#EF5350')

    await mention.send({ embeds: [dm_message] }).catch(self.logger.error)

    if (duration) {
        new TemporaryBan(self, {
            user_id: mention.id,
            guild_id: message.guild.id,
            expires_timestamp: Date.now() + duration,
            reason: reason,
            init: true
        })
    }

    else {
        await message.guild.members.ban(mention, { reason: reason }).catch(self.logger.error)
    }

    if (case_log && server.moderation.case_log.case_types.BAN_ADD) {
        await case_log.send({ embeds: [case_log_message] }).catch(self.logger.error)
    
        await self.db.servers.update({ _id: message.guild.id }, {
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