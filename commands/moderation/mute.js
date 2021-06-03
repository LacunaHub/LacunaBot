const { MessageEmbed } = require('discord.js')
const ms = require('ms')
const moment = require('moment')
const TemporaryMute = require('../../internals/structures/TemporaryMute')
const { images } = require('../../modules/Logs')

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
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.mute.texts.user_not_found, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (mention.hasPermission("MANAGE_ROLES")) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.mute.texts.user_has_moder_permission, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (!mention.manageable) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.mute.texts.cant_mute_user, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const case_log = message.guild.channels.cache.get(server.moderation.case_log.channel_id)
    const case_id = server.moderation.case_log.cases.length + 1

    if (duration) {
        if (duration < ms('1m')) duration = ms('1m')
        else if (duration > ms('2y')) duration = ms('2y')

        reason = `${reason || locale.common.texts.none} (${moment(Date.now() + duration).locale(server.locale).endOf().fromNow(true)})`
    }

    let mute_role = message.guild.roles.cache.get(server.moderation.roles.mute)

    if (!mute_role || message.guild.me.roles.highest.position < mute_role.position) {
        mute_role = await message.guild.roles.create({ data: { name: 'Muted', color: 0x607D8B, permissions: message.guild.roles.everyone.permissions.remove('SEND_MESSAGES') }})
        await self.db.servers.update({ _id: message.guild.id }, {
            $set: {
                'moderation.roles.mute': mute_role.id
            }
        })
    }

    const tempmute = self.tempmutes.find(m => m.user_id == mention.id)

    if (mention.roles.cache.has(mute_role) || tempmute) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.mute.texts.user_already_muted, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    await message.react(self._emojis.details.OK.id).catch(self.logger.error)

    const dm_message = new MessageEmbed()
        .setAuthor(locale.common.case_log.cases.MUTE_ADD, images.MUTE_ADD)
        .addField(locale.common.case_log.server, message.guild.name, true)
        .addField(locale.common.case_log.reason, reason || locale.common.texts.none, true)
        .setTimestamp()
        .setColor('#EF5350')

    const case_log_message = new MessageEmbed()
        .setAuthor(locale.common.case_log.cases.MUTE_ADD, images.MUTE_ADD)
        .addField(locale.common.case_log.target, `${mention.user.tag}\n(${mention.id})`, true)
        .addField(locale.common.case_log.executor, message.author.tag, true)
        .addField(locale.common.case_log.reason, reason || locale.common.texts.none)
        .setFooter(self.translator.format(locale.common.case_log.case, case_id))
        .setTimestamp()
        .setColor('#EF5350')

    await mention.send(dm_message).catch(self.logger.error)

    if (duration) {
        new TemporaryMute(self, {
            user_id: mention.id,
            guild_id: message.guild.id,
            role_id: mute_role.id,
            expires_timestamp: Date.now() + duration,
            reason: reason,
            init: true
        })
    }

    else {
        await mention.roles.add(mute_role).catch(self.logger.error)
        if (mention.voice.channelID) mention.voice.kick().catch(self.logger.error)
    }

    if (case_log && server.moderation.case_log.case_types.MUTE_ADD) {
        await case_log.send(case_log_message).catch(self.logger.error)

        await self.db.servers.update({ _id: message.guild.id }, {
            $push: {
                'moderation.case_log.cases': {
                    case_id: case_id,
                    type: 1 << 3,
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
    name: 'mute',
    description: 'commands.mute.description',
    group: 'moderation',
    guild_only: true,
    self_permissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_ROLES'],
    user_permissions: ['MANAGE_ROLES']
}