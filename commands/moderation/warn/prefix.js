const { MessageEmbed } = require('discord.js')
const { images } = require('../../../modules/Logs')
const Warnings = require('../../../modules/Warnings')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 */
const addPrefix = async (self, server, message) => {
    const locale = self.translator.locale(server.locale).commands

    const mention = message.mentions.members.first() || (message.args[0] ? (await message.guild.members.fetch(message.args[0])) : null)
    const reason = message.args.slice(1).join(' ') || '-'

    if (!mention) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.warn.add.texts.user_not_found, `**${message.member.displayName}**`)}` })

        return false
    }

    await Warnings.add(self, server, message, { target: mention, executor: message.member, reason: reason })

    await message.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.warn.add.texts.user_warned, `**${message.member.displayName}**`, `**${mention.user.tag}**`)}` })

    return true
}

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 */
const removePrefix = async (self, server, message) => {
    const locale = self.translator.locale(server.locale).commands

    const mention = message.mentions.members.first() || (message.args[0] ? (await message.guild.members.fetch(message.args[0])) : null)
    const warn_id = message.args[1]
    const reason = message.args.slice(2).join(' ') || '-'

    if (!mention) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.warn.add.texts.user_not_found, `**${message.member.displayName}**`)}` })

        return false
    }

    if (!warn_id) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.warn.remove.texts.no_warn_id, `**${message.member.displayName}**`)}` })

        return false
    }

    const violator = server.moderation.warnings.violators.find(v => v.user_id == mention.id)

    if (!violator || !violator.violations.length) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.warn.remove.texts.no_violator_or_violations, `**${message.member.displayName}**`)}` })

        return false
    }

    if (warn_id === 'all') {
        await self.db.servers.update({ _id: message.guild.id }, {
            $pull: {
                'moderation.warnings.violators': {
                    user_id: mention.id
                }
            }
        })

        await message.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.warn.remove.texts.warns_removed_all, `**${message.member.displayName}**`)}` })
    }

    else {
        const violation = violator.violations.find((v, i) => v.id == warn_id || (i + 1) == warn_id)

        if (!violation) {
            await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.warn.remove.texts.invalid_warn_id, `**${message.member.displayName}**`)}` })
    
            return false
        }
    
        await self.db.servers.update({ _id: message.guild.id, 'moderation.warnings.violators.user_id': mention.id }, {
            $pull: {
                'moderation.warnings.violators.$.violations': {
                    id: violation.id
                }
            }
        })

        await message.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.warn.remove.texts.warn_removed, `**${message.member.displayName}**`)}` })
    }

    const case_log = message.guild.channels.cache.get(server.moderation.case_log.channel_id)
    const case_id = server.moderation.case_log.cases.length + 1

    const case_log_message = new MessageEmbed()
        .setAuthor(locale.common.case_log.cases.WARN_REMOVE, images.WARN_REMOVE)
        .addField(locale.common.case_log.target, `${mention.user.tag}\n(${mention.id})`, true)
        .addField(locale.common.case_log.executor, message.member.user.tag, true)
        .addField(locale.common.case_log.reason, reason)
        .setFooter(self.translator.format(locale.common.case_log.case, case_id))
        .setTimestamp()
        .setColor('#2FDF84')

    if (case_log && server.moderation.case_log.case_types.WARN_REMOVE) {
        await case_log.send({ embeds: [case_log_message] }).catch(self.logger.error)
    
        await self.db.servers.update({ _id: message.guild.id }, {
            $push: {
                'moderation.case_log.cases': {
                    case_id: case_id,
                    type: 1 << 9,
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

    return true
}

module.exports = { addPrefix, removePrefix }