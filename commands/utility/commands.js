const { MessageEmbed } = require('discord.js')
const { TruncateArray } = require('../../internals/utility/Utils')
const help = require('../general/help')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    await help.fn(self, server, message, ['commands'])

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

    const path = args[0], ref = args.slice(1).join(' ')

    if (!path) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.commands.texts.no_path, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const command = self.commands.get(path)
    const group = self.commands.filter(c => c.group == path && c.manageable).array()

    if (!command && !group.length) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.commands.texts.no_command_or_group, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (command && !command.manageable) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.commands.texts.not_manageable, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const reference = message.mentions.channels.first() || message.guild.channels.cache.find(c => c.id == ref || c.name == ref) || message.mentions.roles.first() || message.guild.roles.cache.find(r => r.id == ref || r.name == ref)
    
    if (reference) {
        const type = 'type' in reference ? 'CHANNEL' : 'ROLE'

        if (command) {
            const config = await command.fetchConfig(message.guild.id)

            if (type === 'CHANNEL') {
                if (config.allowed.channels.includes(reference.id)) await command.allow(message.guild.id, { type: type, reference: reference.id, remove: true })
                else await command.allow(message.guild.id, { type: type, reference: reference.id })
            }

            if (type === 'ROLE') {
                if (config.allowed.roles.includes(reference.id)) await command.allow(message.guild.id, { type: type, reference: reference.id, remove: true })
                else await command.allow(message.guild.id, { type: type, reference: reference.id })
            }
        }

        if (group.length) {
            for (const grouped of group) {
                const config = await grouped.fetchConfig(message.guild.id)

                if (type === 'CHANNEL') {
                    if (config.allowed.channels.includes(reference.id)) await grouped.allow(message.guild.id, { type: type, reference: reference.id, remove: true })
                    else await grouped.allow(message.guild.id, { type: type, reference: reference.id })
                }
    
                if (type === 'ROLE') {
                    if (config.allowed.roles.includes(reference.id)) await grouped.allow(message.guild.id, { type: type, reference: reference.id, remove: true })
                    else await grouped.allow(message.guild.id, { type: type, reference: reference.id })
                }
            }
        }

        await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.commands.texts.config_overwrite, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return true
    }

    if (command) await command.allow(message.guild.id)
    if (group.length) for (const grouped of group) await grouped.allow(message.guild.id)

    await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.commands.texts.active, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

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

    const path = args[0], ref = args.slice(1).join(' ')

    if (!path) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.commands.texts.no_path, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const command = self.commands.get(path)
    const group = self.commands.filter(c => c.group == path && c.manageable).array()

    if (!command && !group.length) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.commands.texts.no_command_or_group, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (command && !command.manageable) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.commands.texts.not_manageable, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const reference = message.mentions.channels.first() || message.guild.channels.cache.find(c => c.id == ref || c.name == ref) || message.mentions.roles.first() || message.guild.roles.cache.find(r => r.id == ref || r.name == ref)
    
    if (reference) {
        const type = 'type' in reference ? 'CHANNEL' : 'ROLE'

        if (command) {
            const config = await command.fetchConfig(message.guild.id)

            if (type === 'CHANNEL') {
                if (config.blocked.channels.includes(reference.id)) await command.block(message.guild.id, { type: type, reference: reference.id, remove: true })
                else await command.block(message.guild.id, { type: type, reference: reference.id })
            }

            if (type === 'ROLE') {
                if (config.blocked.roles.includes(reference.id)) await command.block(message.guild.id, { type: type, reference: reference.id, remove: true })
                else await command.block(message.guild.id, { type: type, reference: reference.id })
            }
        }

        if (group.length) {
            for (const grouped of group) {
                const config = await grouped.fetchConfig(message.guild.id)

                if (type === 'CHANNEL') {
                    if (config.blocked.channels.includes(reference.id)) await grouped.block(message.guild.id, { type: type, reference: reference.id, remove: true })
                    else await grouped.block(message.guild.id, { type: type, reference: reference.id })
                }
    
                if (type === 'ROLE') {
                    if (config.blocked.roles.includes(reference.id)) await grouped.block(message.guild.id, { type: type, reference: reference.id, remove: true })
                    else await grouped.block(message.guild.id, { type: type, reference: reference.id })
                }
            }
        }

        await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.commands.texts.config_overwrite, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return true
    }

    if (command) await command.block(message.guild.id)
    if (group.length) for (const grouped of group) await grouped.block(message.guild.id)

    await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.commands.texts.inactive, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

    return true
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const config = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const command = self.commands.get(args[0])

    if (!command || !command.manageable) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.help.texts.command_not_found, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const config = server.commands.system.find(c => c.name == command.name)

    const embed = new MessageEmbed()
        .setTitle(locale.commands.config.texts.title)
        .setDescription(`${config ? config.inactive ? self._emojis.ERROR : self._emojis.OK : self._emojis.OK} \`${command.name}\``)
        .addField(locale.commands.config.texts.fields.allowed, config && (config.allowed.channels.length || config.allowed.roles.length) ? TruncateArray([...config.allowed.channels.map(c => { return { t: 'C', id: c } }), ...config.allowed.roles.map(r => { return { t: 'R', id: r } })].map(item => item.t == 'C' ? `<#${item.id}>` : `<@&${item.id}>`), 15, ', ') : '-')
        .addField(locale.commands.config.texts.fields.blocked, config && (config.blocked.channels.length || config.blocked.roles.length) ? TruncateArray([...config.blocked.channels.map(c => { return { t: 'C', id: c } }), ...config.blocked.roles.map(r => { return { t: 'R', id: r } })].map(item => item.t == 'C' ? `<#${item.id}>` : `<@&${item.id}>`), 15, ', ') : '-')

    await message.reply({ embed: embed, allowedMentions: { repliedUser: false } })

    return true
}

module.exports = {
    fn: execute,
    name: 'commands',
    description: 'commands.commands.description',
    group: 'utility',
    subcommands: [
        {
            fn: allow,
            name: 'allow',
            description: 'commands.commands.allow.description'
        },
        {
            fn: block,
            name: 'block',
            description: 'commands.commands.block.description'
        },
        {
            fn: config,
            name: 'config',
            description: 'commands.commands.config.description'
        }
    ],
    guild_only: true,
    self_permissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
    user_permissions: ['ADMINISTRATOR']
}