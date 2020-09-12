const { MessageEmbed } = require('discord.js')
const { images } = require('../../modules/Logs')
const id = require('../../internals/utility/UID')

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
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.warn.texts.user_not_found, `**${message.author.username}**`)}`)

        return false
    }

    if (member.hasPermission('MANAGE_ROLES')) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.warn.texts.user_is_moderator, `**${message.author.username}**`)}`)

        return false
    }

    const case_log = message.guild.channels.cache.get(server.moderation.case_log.channel_id)
    const case_id = server.moderation.case_log.cases.length + 1
    const timestamp = Date.now()

    if (message.deletable && !message.deleted) await message.delete()

    if (case_log && server.moderation.case_log.case_types.WARN_ADD) {
        await self.db.servers.update({ _id: message.guild.id }, {
            $push: {
                'moderation.case_log.cases': {
                    case_id: case_id,
                    type: 1 << 8,
                    timestamp: timestamp,
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

    const violator = server.moderation.warnings.violators.find(v => v.user_id == member.id)
    
    if (!violator) {
        await self.db.servers.update({ _id: message.guild.id }, {
            $push: {
                'moderation.warnings.violators': {
                    user_id: member.id,
                    violations: [
                        {
                            id: id.simple(5),
                            timestamp: timestamp,
                            reason: reason || ''
                        }
                    ]
                }
            }
        })
    }

    else {
        await self.db.servers.update({ _id: message.guild.id, 'moderation.warnings.violators.user_id': member.id }, {
            $push: {
                'moderation.warnings.violators.$.violations': {
                    id: id.simple(5),
                    timestamp: timestamp,
                    reason: reason || ''
                }
            }
        })
    }

    const case_log_message = new MessageEmbed()
        .setTitle(locale.common.case_log.cases.WARN_ADD)
        .addField(locale.common.case_log.target, `${member.user.tag}\n(${member.id})`, true)
        .addField(locale.common.case_log.executor, message.author.tag, true)
        .addField(locale.common.case_log.reason, reason || locale.common.texts.none)
        .setFooter(self.translator.format(locale.common.case_log.case, case_id))
        .setThumbnail(images.WARN_ADD)
        .setTimestamp()
        .setColor(0xE19517)

    try {
        await member.send(self.translator.format(locale.warn.texts.user_warned_dm, `**${member.displayName}**`, `**${message.guild.name}**`, `**${reason || locale.common.texts.none}**`))
    } catch (err) {
        switch (err.message) {
            default:
                await message.channel.send(self.translator.format(locale.warn.texts.user_warned_closed_dm, `<@${member.id}>`, `**${reason || locale.common.texts.none}**`))
            break
        }
    }

    if (message.deletable && !message.deleted) await message.delete()
    if (case_log && server.moderation.case_log.case_types.WARN_ADD) await case_log.send(case_log_message)

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

    const mention = message.mentions.users.first() || args[0]

    const member = mention ? await message.guild.members.fetch({ user: mention, cache: false }) : null
    const warn_id = args[1]
    const reason = args.slice(2).join(' ')

    if (!member) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.warn.texts.user_not_found, `**${message.author.username}**`)}`)

        return false
    }

    if (!warn_id) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.warn.remove.texts.no_warn_id, `**${message.author.username}**`)}`)

        return false
    }

    const violator = server.moderation.warnings.violators.find(v => v.user_id == member.id)

    if (!violator || !violator.violations.length) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.warn.remove.texts.no_violator_or_violations, `**${message.author.username}**`)}`)

        return false
    }

    const violation = violator.violations.find(v => v.id == warn_id)

    if (!violation) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.warn.remove.texts.invalid_warn_id, `**${message.author.username}**`)}`)

        return false
    }

    const case_log = message.guild.channels.cache.get(server.moderation.case_log.channel_id)
    const case_id = server.moderation.case_log.cases.length + 1

    if (message.deletable && !message.deleted) await message.delete()

    if (case_log && server.moderation.case_log.case_types.WARN_REMOVE) {
        await self.db.servers.update({ _id: message.guild.id }, {
            $push: {
                'moderation.case_log.cases': {
                    case_id: case_id,
                    type: 1 << 9,
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

    await self.db.servers.update({ _id: message.guild.id, 'moderation.warnings.violators.user_id': member.id }, {
        $pull: {
            'moderation.warnings.violators.$.violations': {
                id: violation.id
            }
        }
    })

    const case_log_message = new MessageEmbed()
        .setTitle(locale.common.case_log.cases.WARN_REMOVE)
        .addField(locale.common.case_log.target, `${member.user.tag}\n(${member.id})`, true)
        .addField(locale.common.case_log.executor, message.author.tag, true)
        .addField(locale.common.case_log.reason, reason || locale.common.texts.none)
        .setFooter(self.translator.format(locale.common.case_log.case, case_id))
        .setThumbnail(images.WARN_REMOVE)
        .setTimestamp()
        .setColor(0xE19517)

    if (message.deletable && !message.deleted) await message.delete()
    if (case_log && server.moderation.case_log.case_types.WARN_REMOVE) await case_log.send(case_log_message)

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