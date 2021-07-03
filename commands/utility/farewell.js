const Farewell = require('../../modules/Farewell')
const help = require('../general/help')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    await help.fn(self, server, message, ['farewell'])

    return true
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const content = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const text = args.join(' ')

    if (!text) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.farewell.content.texts.no_texts, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (text === 'OFF') {
        await self.db.servers.update({ _id: message.guild.id }, {
            $set: {
                'modules.farewell.active': false,
                'modules.farewell.message.content': ''
            }
        })

        await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.farewell.content.texts.module_off, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return true
    }

    await self.db.servers.update({ _id: message.guild.id }, {
        $set: {
            'modules.farewell.active': true,
            'modules.farewell.message.content': text.trim().replace(/\s{2,}/, ' ')
        }
    })

    await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.farewell.content.texts.text_set, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

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
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.farewell.channel.texts.no_direction, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (direction === 'DM') {
        await self.db.servers.update({ _id: message.guild.id }, {
            $set: {
                'modules.farewell.format': 'DM',
                'modules.farewell.channel_id': ''
            }
        })

        await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.farewell.channel.texts.direction_dm, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return true
    }

    const where = message.mentions.channels.first() || message.guild.channels.cache.filter(c => ['text', 'news'].includes(c.type)).find(c => c.id == direction || c.name == direction)

    if (!where) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.farewell.channel.texts.no_where, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    await self.db.servers.update({ _id: message.guild.id }, {
        $set: {
            'modules.farewell.format': 'CHANNEL',
            'modules.farewell.channel_id': where.id
        }
    })

    await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.farewell.channel.texts.direction_channel, `**${message.author.username}**`, `**#${where.name}**`)}`, { allowedMentions: { repliedUser: false } })

    return true
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const save = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const type = args[0], types = ['ROLES', 'NICKNAME']

    if (!type) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.farewell.save.texts.no_save_type, `**${message.author.username}**`, `${types.map(t => `\`${t}\``).join(' ')}`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (!types.includes(type)) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.farewell.save.texts.unknown_save_type, `**${message.author.username}**`, `${types.map(t => `\`${t}\``).join(' ')}`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (type == 'ROLES') {
        await self.db.servers.update({ _id: message.guild.id }, {
            $set: {
                'modules.restoring.restore_roles': !server.modules.restoring.restore_roles
            }
        })

        await message.react(server.modules.restoring.restore_roles ? '🔴' : '🟢')
    }

    else if (type == 'NICKNAME') {
        await self.db.servers.update({ _id: message.guild.id }, {
            $set: {
                'modules.restoring.restore_nicknames': !server.modules.restoring.restore_nicknames
            }
        })

        await message.react(server.modules.restoring.restore_nicknames ? '🔴' : '🟢')
    }

    return true
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
 const test = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    if (!server.modules.farewell.active) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.farewell.test.texts.inactive, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if ((!server.modules.farewell.message.content && !server.modules.farewell.message.embed.active)) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.farewell.test.texts.no_content, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    await Farewell.Handle(self, server, message.member)

    return true
}

module.exports = {
    fn: execute,
    name: 'farewell',
    description: 'commands.farewell.description',
    group: 'utility',
    subcommands: [
        {
            fn: content,
            name: 'content',
            description: 'commands.farewell.content.description'
        },
        {
            fn: channel,
            name: 'channel',
            description: 'commands.farewell.channel.description'
        },
        {
            fn: save,
            name: 'save',
            description: 'commands.farewell.save.description'
        },
        {
            fn: test,
            name: 'test',
            description: 'commands.farewell.test.description'
        }
    ],
    guild_only: true,
    self_permissions: ['SEND_MESSAGES'],
    user_permissions: ['ADMINISTRATOR']
}