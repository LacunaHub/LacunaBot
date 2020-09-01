const { MessageEmbed } = require('discord.js')
const { images } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const mention = message.mentions.users.first() || args[0]

    const member = mention ? await message.guild.members.fetch({ user: mention, cache: false }) : null
    const reason = args.slice(1).join(' ')

    if (!member) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.user_not_found, `**${message.author.username}**`)}`)

        return false
    }

    if (member.hasPermission("BAN_MEMBERS")) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.user_has_moder_permission, `**${message.author.username}**`)}`)

        return false
    }

    if (!member.bannable) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.cant_ban_user, `**${message.author.username}**`)}`)

        return false
    }

    const case_log = message.guild.channels.cache.get(server.moderation.case_log.channel_id)
    const case_id = server.moderation.case_log.cases.length + 1

    if (message.deletable && !message.deleted) await message.delete()

    if (case_log) {
        await self.db.servers.update({ _id: message.guild.id }, {
            $push: {
                'moderation.case_log.cases': {
                    case_id: case_id,
                    type: 1 << 0,
                    timestamp: Date.now(),
                    reason: reason || '',
                    target: {
                        id: member.id,
                        name: member.user.tag
                    },
                    executor: {
                        id: message.author.id,
                        name: message.author.tag
                    }
                }
            }
        })
    }

    const dm_message = new MessageEmbed()
        .setAuthor(member.user.tag, member.user.displayAvatarURL())
        .setDescription(self.translator.format(locale.ban.texts.dm_message_description, `**${message.guild.name}**`))
        .addField(locale.common.case_log.reason, reason || locale.common.texts.none)
        .setThumbnail(message.guild.iconURL())
        .setTimestamp()
        .setColor(0xF04747)

    const case_log_message = new MessageEmbed()
        .setTitle(locale.common.case_log.cases.BAN_ADD)
        .addField(locale.common.case_log.target, `${member.user.tag}\n(${member.id})`, true)
        .addField(locale.common.case_log.executor, message.author.tag, true)
        .addField(locale.common.case_log.reason, reason || locale.common.texts.none)
        .setFooter(self.translator.format(locale.common.case_log.case, case_id))
        .setThumbnail(images.BAN_ADD)
        .setTimestamp()
        .setColor(0xF04747)

    try {
        await member.send(dm_message)
    } catch (err) {
        await self.logger.error(err)
    }

    await message.guild.members.ban(member, { reason: reason })
    if (case_log) await case_log.send(case_log_message)

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