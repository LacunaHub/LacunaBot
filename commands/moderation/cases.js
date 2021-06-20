const help = require('../general/help')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    await help.fn(self, server, message, ['cases'])

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

    const channel = message.mentions.channels.first() || message.guild.channels.cache.filter(c => ['text', 'news'].includes(c.type)).find(c => c.id == args[0] || c.name == args[0])

    if (!args[0]) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.cases.channel.texts.no_channel_argument, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (!channel || channel.type != 'text') {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.cases.channel.texts.invalid_channel, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    await self.db.servers.update({ _id: message.guild.id }, {
        $set: {
            'moderation.case_log.channel_id': channel.id
        }
    })

    await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.cases.channel.texts.case_log_set, `**${message.author.username}**`, `**#${channel.name}**`)}`, { allowedMentions: { repliedUser: false } })

    return true
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const toggle = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const event = args[0]

    if (!event) {
        const event_types = Object.keys(server.moderation.case_log.case_types).filter(k => k != '$init').map(k => `\`${k}\``).join(', ')
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.cases.toggle.texts.event_type_not_entered, `**${message.author.username}**`, event_types)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const event_exists = event in server.moderation.case_log.case_types

    if (!event_exists) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.cases.toggle.texts.event_type_not_found, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const event_entry = server.moderation.case_log.case_types[event]

    await self.db.servers.update({ _id: message.guild.id }, {
        $set: {
            [`moderation.case_log.case_types.${event}`]: event_entry ? false : true
        }
    })

    await message.reply(`${self._emojis.OK} | ${self.translator.format(event_entry ? locale.cases.toggle.texts.event_type_disable : locale.cases.toggle.texts.event_type_enable, `**${message.author.username}**`, `\`${event}\``)}`, { allowedMentions: { repliedUser: false } })

    return true
}

module.exports = {
    fn: execute,
    name: 'cases',
    description: 'commands.cases.description',
    group: 'moderation',
    subcommands: [
        {
            fn: channel,
            name: 'channel',
            description: 'commands.cases.channel.description'
        },
        {
            fn: toggle,
            name: 'toggle',
            description: 'commands.cases.toggle.description'
        }
    ],
    guild_only: true,
    self_permissions: ['SEND_MESSAGES'],
    user_permissions: ['ADMINISTRATOR']
}