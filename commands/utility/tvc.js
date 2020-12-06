const { MessageEmbed } = require('discord.js')
const id = require('../../internals/utility/UID')
const help = require('../general/help')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    await help.fn(self, server, message, ['tvc'])

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

    if (server.modules.voice_manager.temp_voice_channels.triggers.length >= 1 && !server.server.premium.available) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.tvc.add.texts.triggers_limit_no_premium, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (server.modules.voice_manager.temp_voice_channels.triggers.length >= 25) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.tvc.add.texts.triggers_limit, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const channel = message.guild.channels.cache.filter(c => c.type == 'voice').find(c => c.id == args[0] || c.name == args[0])
    const user_limit = isNaN(args[1]) ? 0 : Number(args[1])
    const voice_name = args.slice(2).join(' ') || (channel ? channel.name : '')
    
    if (!channel) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.tvc.add.texts.no_voice_channel, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const exists = server.modules.voice_manager.temp_voice_channels.triggers.some(t => t.channel_id == channel.id)

    if (exists) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.tvc.add.texts.trigger_exists, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const uid = id.simple(6)

    const embed = new MessageEmbed()
        .setTitle(locale.tvc.add.texts.success.title)
        .addField(locale.tvc.add.texts.success.uid, uid, true)
        .addField(locale.tvc.add.texts.success.name, channel.name, true)
        .addField('\u200B', '\u200B', true)
        .setColor(0x43b581)
    
    await self.db.servers.update({ _id: message.guild.id }, {
        $push: {
            'modules.voice_manager.temp_voice_channels.triggers': {
                id: uid,
                channel_id: channel.id,
                default: {
                    name: voice_name.trim(),
                    limit: user_limit,
                    permissions: 0
                },
                children: []
            }
        }
    })

    await message.reply({ embed: embed, allowedMentions: { repliedUser: false } })

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

    const uid = args[0]

    if (!uid) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.tvc.remove.texts.no_uid, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const exists = server.modules.voice_manager.temp_voice_channels.triggers.some(t => t.id == uid)

    if (!exists) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.tvc.remove.texts.not_exists, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    await self.db.servers.update({ _id: message.guild.id }, {
        $pull: {
            'modules.voice_manager.temp_voice_channels.triggers': {
                id: uid
            }
        }
    })

    await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.tvc.remove.texts.deleted, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

    return true
}

module.exports = {
    fn: execute,
    name: 'tvc',
    description: 'commands.tvc.description',
    group: 'utility',
    subcommands: [
        {
            fn: add,
            name: 'add',
            description: 'commands.tvc.add.description'
        },
        {
            fn: remove,
            name: 'remove',
            description: 'commands.tvc.remove.description'
        }
    ],
    guild_only: true,
    self_permissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_CHANNELS'],
    user_permissions: ['ADMINISTRATOR']
}