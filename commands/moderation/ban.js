const { MessageEmbed } = require('discord.js')
const ms = require('ms')
const moment = require('moment')
const { images } = require('../../modules/Logs')
const TemporaryBan = require('../../internals/structures/TemporaryBan')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    /**
     * @type {import('discord.js').GuildMember}
     */
    const mention = message.mentions.members.first() || (self.utils.isSnowflake(args[0]) ? await message.guild.members._fetchSingle({ user: args[0], cache: false }) : null)
    let duration = args[1] && ms(args[1]) ? ms(args[1]) : null
    let reason = args.slice(duration ? 2 : 1).join(' ')

    if (!mention) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.user_not_found, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (mention.hasPermission("BAN_MEMBERS")) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.user_has_moder_permission, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (!mention.bannable) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.cant_ban_user, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const case_log = message.guild.channels.cache.get(server.moderation.case_log.channel_id)
    const case_id = server.moderation.case_log.cases.length + 1

    if (duration) {
        if (duration < ms('1m')) duration = ms('1m')
        else if (duration > ms('2y')) duration = ms('2y')

        reason = `${reason || locale.common.texts.none} (${moment(Date.now() + duration).locale(server.locale).endOf().fromNow(true)})`
    }

    await message.react(self._emojis.details.OK.id).catch(self.logger.error)

    const dm_message = new MessageEmbed()
        .setAuthor(locale.common.case_log.cases.BAN_ADD, images.BAN_ADD)
        .addField(locale.common.case_log.server, message.guild.name, true)
        .addField(locale.common.case_log.reason, reason || locale.common.texts.none, true)
        .setTimestamp()
        .setColor('#EF5350')

    const case_log_message = new MessageEmbed()
        .setAuthor(locale.common.case_log.cases.BAN_ADD, images.BAN_ADD)
        .addField(locale.common.case_log.target, `${mention.user.tag}\n(${mention.id})`, true)
        .addField(locale.common.case_log.executor, message.author.tag, true)
        .addField(locale.common.case_log.reason, reason || locale.common.texts.none)
        .setFooter(self.translator.format(locale.common.case_log.case, case_id))
        .setTimestamp()
        .setColor('#EF5350')

    await mention.send(dm_message).catch(self.logger.error)

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
        await case_log.send(case_log_message).catch(self.logger.error)
    
        await self.db.servers.update({ _id: message.guild.id }, {
            $push: {
                'moderation.case_log.cases': {
                    case_id: case_id,
                    type: 1 << 0,
                    timestamp: Date.now(),
                    reason: reason || '',
                    target: {
                        id: mention.id,
                        name: mention.user.tag
                    },
                    executor: {
                        id: message.author.id,
                        name: message.author.tag
                    }
                }
            }
        })
    }

    return true
}

module.exports = {
    fn: execute,
    name: 'ban',
    description: 'commands.ban.description',
    group: 'moderation',
    guild_only: true,
    self_permissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'BAN_MEMBERS'],
    user_permissions: ['BAN_MEMBERS']
}