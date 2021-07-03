const Greeting = require('../../modules/Greeting')
const help = require('../general/help')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    await help.fn(self, server, message, ['greeting'])

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
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.greeting.content.texts.no_texts, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (text === 'OFF') {
        await self.db.servers.update({ _id: message.guild.id }, {
            $set: {
                'modules.welcome.active': false,
                'modules.welcome.message.content': ''
            }
        })

        await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.greeting.content.texts.module_off, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return true
    }

    await self.db.servers.update({ _id: message.guild.id }, {
        $set: {
            'modules.welcome.active': true,
            'modules.welcome.message.content': text.trim().replace(/\s{2,}/, ' ')
        }
    })

    await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.greeting.content.texts.text_set, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

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
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.greeting.channel.texts.no_direction, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (direction === 'DM') {
        await self.db.servers.update({ _id: message.guild.id }, {
            $set: {
                'modules.welcome.format': 'DM',
                'modules.welcome.channel_id': ''
            }
        })

        await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.greeting.channel.texts.direction_dm, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return true
    }

    const where = message.mentions.channels.first() || message.guild.channels.cache.filter(c => ['text', 'news'].includes(c.type)).find(c => c.id == direction || c.name == direction)

    if (!where) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.greeting.channel.texts.no_where, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    await self.db.servers.update({ _id: message.guild.id }, {
        $set: {
            'modules.welcome.format': 'CHANNEL',
            'modules.welcome.channel_id': where.id
        }
    })

    await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.greeting.channel.texts.direction_channel, `**${message.author.username}**`, `**#${where.name}**`)}`, { allowedMentions: { repliedUser: false } })

    return true
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const roles = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const argument = args.join(' ')

    if (!argument) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.greeting.roles.texts.no_argument, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (argument === 'OFF') {
        await self.db.servers.update({ _id: message.guild.id }, {
            $set: {
                'modules.welcome.initial_roles.active': false,
                'modules.welcome.initial_roles.roles': []
            }
        })

        await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.greeting.roles.texts.argument_off, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return true
    }

    const initial_roles = message.mentions.roles.first() ? message.mentions.roles.first(3) : message.guild.roles.cache.filter(r => args.some(a => a == r.id)).first(3)

    if (!initial_roles.length) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.greeting.roles.texts.no_initial_roles, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    await self.db.servers.update({ _id: message.guild.id }, {
        $set: {
            'modules.welcome.initial_roles.active': true,
            'modules.welcome.initial_roles.roles': initial_roles.map(r => r.id)
        }
    })

    await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.greeting.roles.texts.roles_set, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

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

    if (!server.modules.welcome.active) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.greeting.test.texts.inactive, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if ((!server.modules.welcome.message.content && !server.modules.welcome.message.embed.active)) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.greeting.test.texts.no_content, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    await Greeting.Handle(self, server, message.member)

    return true
}

module.exports = {
    fn: execute,
    name: 'greeting',
    description: 'commands.greeting.description',
    group: 'utility',
    subcommands: [
        {
            fn: content,
            name: 'content',
            description: 'commands.greeting.content.description'
        },
        {
            fn: channel,
            name: 'channel',
            description: 'commands.greeting.channel.description'
        },
        {
            fn: roles,
            name: 'roles',
            description: 'commands.greeting.roles.description'
        },
        {
            fn: test,
            name: 'test',
            description: 'commands.greeting.test.description'
        }
    ],
    guild_only: true,
    self_permissions: ['SEND_MESSAGES'],
    user_permissions: ['ADMINISTRATOR']
}