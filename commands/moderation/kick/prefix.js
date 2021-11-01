const { MessageEmbed } = require('discord.js')
const { images } = require('../../../modules/Logs')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 */
module.exports = async (self, server, message) => {
    const locale = self.translator.locale(server.locale).commands

    const mention = message.mentions.members.first() || (message.args[0] ? (await message.guild.members.fetch(message.args[0])) : null)
    const reason = message.args[1] ?? '-'

    if (!mention) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.kick.texts.user_not_found, `**${message.member.displayName}**`)}` })

        return false
    }

    if (!mention.kickable) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.kick.texts.cant_kick_user, `**${message.member.displayName}**`)}` })

        return false
    }

    const case_log = message.guild.channels.cache.get(server.moderation.case_log.channel_id)
    const case_id = server.moderation.case_log.cases.length + 1

    const dm_message = new MessageEmbed()
        .setAuthor(locale.common.case_log.cases.KICK, images.KICK)
        .addField(locale.common.case_log.server, message.guild.name, true)
        .addField(locale.common.case_log.reason, reason, true)
        .setTimestamp()
        .setColor('#EF5350')

    const case_log_message = new MessageEmbed()
        .setAuthor(locale.common.case_log.cases.KICK, images.KICK)
        .addField(locale.common.case_log.target, `${mention.user.tag}\n(${mention.id})`, true)
        .addField(locale.common.case_log.executor, message.member.user.tag, true)
        .addField(locale.common.case_log.reason, reason)
        .setFooter(self.translator.format(locale.common.case_log.case, case_id))
        .setTimestamp()
        .setColor('#EF5350')

    await mention.send({ content: dm_message }).catch(self.logger.error)

    await mention.kick(reason).catch(self.logger.error)

    if (case_log && server.moderation.case_log.case_types.KICK) {
        await case_log.send({ content: case_log_message }).catch(self.logger.error)
    
        await self.db.servers.update({ _id: message.guild.id }, {
            $push: {
                'moderation.case_log.cases': {
                    case_id: case_id,
                    type: 1 << 2,
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

    await message.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.kick.texts.user_kicked, `**${message.member.displayName}**`, `**${mention.user.tag}**`)}` })

    return true
}