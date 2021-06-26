const { MessageEmbed } = require('discord.js')
const { images } = require('../../modules/Logs')
const Warnings = require('../../modules/Warnings')

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
    const reason = args.slice(1).join(' ')

    if (!mention) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.warn.texts.user_not_found, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (mention.hasPermission('MANAGE_ROLES')) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.warn.texts.user_is_moderator, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    await message.react(self._emojis.details.OK.id).catch(self.logger.error)

    await Warnings.add(self, server, message, { target: mention, executor: message.member, reason: reason })

    return true
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const remove = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    /**
     * @type {import('discord.js').GuildMember}
     */
    const mention = message.mentions.members.first() || (self.utils.isSnowflake(args[0]) ? await message.guild.members._fetchSingle({ user: args[0], cache: false }) : null)
    const warn_id = args[1]
    const reason = args.slice(2).join(' ')

    if (!mention) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.warn.texts.user_not_found, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (!warn_id) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.warn.remove.texts.no_warn_id, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const violator = server.moderation.warnings.violators.find(v => v.user_id == mention.id)

    if (!violator || !violator.violations.length) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.warn.remove.texts.no_violator_or_violations, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

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

        await message.react(self._emojis.details.OK.id).catch(self.logger.error)

        return true
    }

    const violation = violator.violations.find((v, i) => v.id == warn_id || (i + 1) == warn_id)

    if (!violation) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.warn.remove.texts.invalid_warn_id, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    await message.react(self._emojis.details.OK.id).catch(self.logger.error)

    const case_log = message.guild.channels.cache.get(server.moderation.case_log.channel_id)
    const case_id = server.moderation.case_log.cases.length + 1

    await self.db.servers.update({ _id: message.guild.id, 'moderation.warnings.violators.user_id': mention.id }, {
        $pull: {
            'moderation.warnings.violators.$.violations': {
                id: violation.id
            }
        }
    })

    const case_log_message = new MessageEmbed()
        .setAuthor(locale.common.case_log.cases.WARN_REMOVE, images.WARN_REMOVE)
        .addField(locale.common.case_log.target, `${mention.user.tag}\n(${mention.id})`, true)
        .addField(locale.common.case_log.executor, message.author.tag, true)
        .addField(locale.common.case_log.reason, reason || locale.common.texts.none)
        .setFooter(self.translator.format(locale.common.case_log.case, case_id))
        .setTimestamp()
        .setColor('#2FDF84')

    if (case_log && server.moderation.case_log.case_types.WARN_REMOVE) {
        await case_log.send(case_log_message).catch(self.logger.error)
    
        await self.db.servers.update({ _id: message.guild.id }, {
            $push: {
                'moderation.case_log.cases': {
                    case_id: case_id,
                    type: 1 << 9,
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
    name: 'warn',
    description: 'commands.warn.description',
    group: 'moderation',
    subcommands: [
        {
            fn: remove,
            name: 'remove',
            description: 'commands.warn.remove.description'
        }
    ],
    guild_only: true,
    self_permissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
    user_permissions: ['MANAGE_ROLES']
}