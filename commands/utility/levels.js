const help = require('../general/help')
const UID = require('../../internals/utility/UID')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    await help.fn(self, server, message, ['levels'])

    return true
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const allow = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const argument = args.join(' ')

    if (!argument) {
        if (server.modules.levels.active) {
            await message.react(self._emojis.details.ERROR.id)

            return false
        }

        await self.db.servers.update({ _id: message.guild.id }, {
            $set: {
                'modules.levels.active': true
            }
        })

        await message.channel.send(`${self._emojis.OK} | ${self.translator.format(locale.levels.allow.texts.levels_allowed, `**${message.author.username}**`)}`)

        return true
    }

    const reference = message.mentions.channels.first() || message.guild.channels.cache.get(argument) || message.mentions.roles.first() || message.guild.roles.cache.find(r => r.id == argument || r.name == argument)

    if (!reference) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.levels.allow.texts.no_reference, `**${message.author.username}**`)}`)

        return false
    }

    const type = 'type' in reference ? 'CHANNEL' : 'ROLE'
    const includes = server.modules.levels.allowed.channels.includes(reference.id) || server.modules.levels.allowed.roles.includes(reference)
    const to = type == 'CHANNEL' ? 'channels' : 'roles'

    if (includes) {
        await self.db.servers.update({ _id: message.guild.id }, {
            $pull: {
                [`modules.levels.allowed.${to}`]: reference.id
            }
        })
    }

    else {
        await self.db.servers.update({ _id: message.guild.id }, {
            $push: {
                [`modules.levels.allowed.${to}`]: reference.id
            }
        })
    }

    await message.react(self._emojis.details.OK.id)

    return true
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const block = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const argument = args.join(' ')

    if (!argument) {
        if (!server.modules.levels.active) {
            await message.react(self._emojis.details.ERROR.id)

            return false
        }

        await self.db.servers.update({ _id: message.guild.id }, {
            $set: {
                'modules.levels.active': false
            }
        })

        await message.channel.send(`${self._emojis.OK} | ${self.translator.format(locale.levels.block.texts.levels_blocked, `**${message.author.username}**`)}`)

        return true
    }

    const reference = message.mentions.channels.first() || message.guild.channels.cache.get(argument) || message.mentions.roles.first() || message.guild.roles.cache.find(r => r.id == argument || r.name == argument)

    if (!reference) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.levels.block.texts.no_reference, `**${message.author.username}**`)}`)

        return false
    }

    const type = 'type' in reference ? 'CHANNEL' : 'ROLE'
    const includes = server.modules.levels.blocked.channels.includes(reference.id) || server.modules.levels.blocked.roles.includes(reference)
    const to = type == 'CHANNEL' ? 'channels' : 'roles'

    if (includes) {
        await self.db.servers.update({ _id: message.guild.id }, {
            $pull: {
                [`modules.levels.blocked.${to}`]: reference.id
            }
        })
    }

    else {
        await self.db.servers.update({ _id: message.guild.id }, {
            $push: {
                [`modules.levels.blocked.${to}`]: reference.id
            }
        })
    }

    await message.react(self._emojis.details.OK.id)

    return true
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const add = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    if (server.modules.levels.awards.length >= 250) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.levels.add.texts.awards_limit_reached, `**${message.author.username}**`)}`)

        return false
    }

    const level = args[0] ? args[0].match(/\d+/) : null
    const award = args.slice(1).join(' ')

    const reference = message.mentions.roles.first() || message.guild.roles.cache.find(r => r.id == award || r.name == award)

    if (!level || (!award || !reference)) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.levels.add.texts.invalid_arguments, `**${message.author.username}**`)}`)

        return false
    }

    if (!reference.editable) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.levels.add.texts.not_editable_reference, `**${message.author.username}**`)}`)

        return false
    }

    if (level < 0 || level > 2500) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.levels.add.texts.invalid_level, `**${message.author.username}**`)}`)

        return false
    }

    if (server.modules.levels.awards.some(a => a.level == level)) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.levels.add.texts.level_award_exists, `**${message.author.username}**`)}`)

        return false
    }

    if (server.modules.levels.awards.some(a => a.references.includes(reference.id))) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.levels.add.texts.reference_already_used, `**${message.author.username}**`)}`)

        return false
    }

    await self.db.servers.update({ _id: message.guild.id }, {
        $addToSet: {
            'modules.levels.awards': {
                id: UID.simple(7),
                level: Number(level),
                type: 'type' in reference ? 'CHANNEL' : 'ROLE',
                references: [reference.id]
            }
        }
    })

    await message.channel.send(`${self._emojis.OK} | ${self.translator.format(locale.levels.add.texts.award_added, `**${message.author.username}**`)}`)

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

    const level = Number(args[0])

    if (!level || isNaN(level)) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.levels.remove.texts.invalid_level_argument, `**${message.author.username}**`)}`)

        return false
    }

    const award = server.modules.levels.awards.some(a => a.level == level)

    if (!award) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.levels.remove.texts.no_award_for_level, `**${message.author.username}**`)}`)

        return false
    }

    await self.db.servers.update({ _id: message.guild.id }, {
        $pull: {
            'modules.levels.awards': {
                level: level
            }
        }
    })

    await message.channel.send(`${self._emojis.OK} | ${self.translator.format(locale.levels.remove.texts.award_removed, `**${message.author.username}**`)}`)

    return true
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const alerts = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const format = args[0]
    let text = args.slice(1).join(' ')

    if (!format) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.levels.alerts.texts.no_format, `**${message.author.username}**`)}`)

        return false
    }

    if (format == 'OFF') {
        if (!server.modules.levels.level_up_alerts.active) {
            await message.react(self._emojis.details.ERROR.id)

            return false
        }

        await self.db.servers.update({ _id: message.guild.id }, {
            $set: {
                'modules.levels.level_up_alerts.active': false
            }
        })

        await message.channel.send(`${self._emojis.OK} | ${self.translator.format(locale.levels.alerts.texts.alerts_off, `**${message.author.username}**`)}`)

        return true
    }

    if (format == 'DM') {
        if (server.modules.levels.level_up_alerts.format == 1) {
            await message.react(self._emojis.details.ERROR.id)

            return false
        }

        await self.db.servers.update({ _id: message.guild.id }, {
            $set: {
                'modules.levels.level_up_alerts.active': true,
                'modules.levels.level_up_alerts.format': 1,
                'modules.levels.level_up_alerts.message.content': text ? text.replace(/\s{2,}/, ' ').trim() : server.modules.levels.level_up_alerts.message.content
            }
        })

        await message.channel.send(`${self._emojis.OK} | ${self.translator.format(locale.levels.alerts.texts.alerts_dm, `**${message.author.username}**`)}`)

        return true
    }

    if (!text) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.levels.alerts.texts.no_text, `**${message.author.username}**`)}`)

        return false
    }

    text = `${format} ${text}`

    await self.db.servers.update({ _id: message.guild.id }, {
        $set: {
            'modules.levels.level_up_alerts.active': true,
            'modules.levels.level_up_alerts.format': 0,
            'modules.levels.level_up_alerts.message.content': text.replace(/\s{2,}/, ' ').trim()
        }
    })

    await message.channel.send(`${self._emojis.OK} | ${self.translator.format(locale.levels.alerts.texts.text_set, `**${message.author.username}**`)}`)

    return true
}

module.exports = {
    fn: execute,
    name: 'levels',
    description: 'commands.levels.description',
    group: 'utility',
    subcommands: [
        {
            fn: allow,
            name: 'allow',
            description: 'commands.levels.allow.description'
        },
        {
            fn: block,
            name: 'block',
            description: 'commands.levels.block.description'
        },
        {
            fn: add,
            name: 'add',
            description: 'commands.levels.add.description'
        },
        {
            fn: remove,
            name: 'remove',
            description: 'commands.levels.remove.description'
        },
        {
            fn: alerts,
            name: 'alerts',
            description: 'commands.levels.alerts.description'
        }
    ],
    guild_only: true,
    self_permissions: ['SEND_MESSAGES'],
    user_permissions: ['ADMINISTRATOR']
}