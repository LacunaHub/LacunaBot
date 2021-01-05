const help = require('../general/help')
const { Util } = require('discord.js')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    await help.fn(self, server, message, ['reports'])

    return true
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const channel = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const direction = args[0]

    if (!direction) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reports.channel.texts.no_direction, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (direction === 'OFF') {
        await self.db.servers.update({ _id: message.guild.id }, {
            $set: {
                'modules.reports.active': false,
                'modules.reports.channel_id': ''
            }
        })

        await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.reports.channel.texts.direction_off, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return true
    }

    const where = message.mentions.channels.first() || message.guild.channels.cache.filter(c => c.type == 'text').find(c => c.id == direction || c.name == direction)

    if (!where) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reports.channel.texts.no_where, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    await self.db.servers.update({ _id: message.guild.id }, {
        $set: {
            'modules.reports.active': true,
            'modules.reports.channel_id': where.id
        }
    })

    await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.reports.channel.texts.activated, `**${message.author.username}**`, `**#${where.name}**`)}`, { allowedMentions: { repliedUser: false } })

    return true
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const emoji = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const emoji = Util.parseEmoji(args[0])
    const minimum = args[1] && !isNaN(Number(args[1])) ? Number(args[1]) : 0

    if (!emoji || minimum < 0) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reports.emoji.texts.invalid_arguments, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    await self.db.servers.update({ _id: message.guild.id }, {
        $set: {
            'modules.reports.emoji.animated': emoji.animated,
            'modules.reports.emoji.id': emoji.id,
            'modules.reports.emoji.name': emoji.name,
            'modules.reports.minimum': minimum && server.modules.reports.minimum != minimum ? minimum : server.modules.reports.minimum
        }
    })

    await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.reports.emoji.texts.success, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

    return true
}

module.exports = {
    fn: execute,
    name: 'reports',
    description: 'commands.reports.description',
    group: 'utility',
    subcommands: [
        {
            fn: channel,
            name: 'channel',
            description: 'commands.reports.channel.description'
        },
        {
            fn: emoji,
            name: 'emoji',
            description: 'commands.reports.emoji.description'
        }
    ],
    guild_only: true,
    self_permissions: ['SEND_MESSAGES'],
    user_permissions: ['ADMINISTRATOR']
}