const { MessageEmbed } = require('discord.js')
const moment = require('moment')
const ms = require('ms')
const Giveaway = require('../../internals/structures/Giveaway')
const { TruncateString } = require('../../internals/utility/Utils')
const help = require('../general/help')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    await help.fn(self, server, message, ['giveaway'])

    return true
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const create = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    let timer = args[0], winners_amount = args[1] ? args[1].match(/\d+/g) : null, prize = args.slice(winners_amount ? 2 : 1).join(' ')

    if (!timer || !prize) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.create.texts.no_timer_or_prize, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    timer = ms(timer)

    if (!timer) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.create.texts.invalid_time, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (ms(timer) < ms('1m')) timer = ms('1m')
    else if (ms(timer) > ms('21d')) timer = ms('21d')

    winners_amount = winners_amount ? Number(winners_amount) : 1
    if (winners_amount > 50) winners_amount = 50

    if (server.utility.giveaways.length > 30) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.create.texts.max_allowed_giveaways_reached, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    prize = TruncateString(prize, 100)

    const embed = new MessageEmbed()
        .setTitle(prize)
        .setDescription(locale.giveaway.create.texts.giveaway_participate)
        .setFooter(self.translator.format(locale.giveaway.create.texts.giveaways_remains, moment(Date.now() + timer).locale(server.locale).endOf().fromNow()))
        .setColor(0x43b581)

    if (message.deletable && !message.deleted) await message.delete()

    const __message = await message.channel.send(`**${locale.giveaway.create.texts.giveaway_started}**`, embed)
    await __message.react('🎉')

    new Giveaway(self, {
        message_id: __message.id,
        channel_id: __message.channel.id,
        guild_id: message.guild.id,
        prize: prize,
        winners_amount: winners_amount,
        expiration_date: new Date(Date.now() + timer),
        locale: server.locale,
        init: true
    })

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

    const message_id = args[0]

    if (!message_id) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.remove.texts.no_message_id, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const giveaway = self.giveaways.find(g => g.message_id == message_id)

    if (!giveaway) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.remove.texts.giveaway_not_found, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const ga_message = await giveaway.getMessage()

    if (!ga_message) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.remove.texts.ga_message_not_found, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    await giveaway.end(false)
    if (message.deletable && !message.deleted) await message.delete()
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
 const end = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const message_id = args[0]

    if (!message_id) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.remove.texts.no_message_id, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const giveaway = self.giveaways.find(g => g.message_id == message_id)

    if (!giveaway) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.remove.texts.giveaway_not_found, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const ga_message = await giveaway.getMessage()

    if (!ga_message) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.remove.texts.ga_message_not_found, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    await giveaway.end()
}

module.exports = {
    fn: execute,
    name: 'giveaway',
    description: 'commands.giveaway.description',
    group: 'utility',
    subcommands: [
        {
            fn: create,
            name: 'create',
            description: 'commands.giveaway.create.description'
        },
        {
            fn: remove,
            name: 'remove',
            description: 'commands.giveaway.remove.description'
        },
        {
            fn: end,
            name: 'end',
            description: 'commands.giveaway.end.description'
        },
    ],
    guild_only: true,
    self_permissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
    user_permissions: ['MANAGE_MESSAGES']
}