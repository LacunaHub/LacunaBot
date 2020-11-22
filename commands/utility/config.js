const { MessageEmbed } = require('discord.js')
const { TruncateString, TruncateArray } = require('../../internals/utility/Utils')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const embed = new MessageEmbed()
        .setTitle(locale.config.texts.title)
        .addField(locale.config.texts.prefix, `\`${server.prefix}\``, true)
        .addField(locale.config.texts.locale, `\`${server.locale}\``, true)
        .addField(locale.config.texts.bonuses, server.server.premium.available ? self._emojis.OK : self._emojis.ERROR, true)
        .addField(locale.config.texts.moderation.title, self.translator.format(locale.config.texts.moderation.value, server.moderation.case_log.channel_id ? `<#${server.moderation.case_log.channel_id}>` : '', Object.entries(server.moderation.case_log.case_types).filter(k => !k[1]).map(k => `\`${k[0]}\``).join(', ') || locale.common.texts.none, server.moderation.roles.mute ? `<@&${server.moderation.roles.mute}>` : ''))

    await message.channel.send(embed)

    return true
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const reactions = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const message_id = args[0]

    if (!message_id) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.config.reactions.texts.no_message_id, `**${message.author.username}**`)}`)

        return false
    }

    const elements = server.modules.reactions.filter(r => r.message.id == message_id)

    if (!elements.length) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.config.reactions.texts.no_elements, `**${message.author.username}**`)}`)

        return false
    }

    const channels = elements.filter(r => r.type === 'CHANNEL').map(r => `${r.references.map(ref => `<#${ref}>`).join(', ')} – ${r.emoji.id ? `<${r.emoji.animated ? 'a' : ''}:${r.emoji.name}:${r.emoji.id}>`: r.emoji.name} \`${r.id}\``).join('\n') || ''

    const roles = elements.filter(r => r.type === 'ROLE').map(r => `${r.references.map(ref => message.guild.roles.cache.get(ref) ? `**@${message.guild.roles.cache.get(ref).name}**` : `**@${ref}**`).join(', ')} – ${r.emoji.id ? `<${r.emoji.animated ? 'a' : ''}:${r.emoji.name}:${r.emoji.id}>`: r.emoji.name} \`${r.id}\``).join('\n') || ''

    await message.channel.send(`${channels}\n\n${roles}`)
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const tvc = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    if (!server.modules.voice_manager.temp_voice_channels.triggers.length) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.config.tvc.texts.no_voice_triggers, `**${message.author.username}**`)}`)

        return false
    }

    const embed = new MessageEmbed()
        .setTitle(locale.config.tvc.texts.title)
    
    for (const trigger of server.modules.voice_manager.temp_voice_channels.triggers) {
        embed.addField(trigger.id, self.translator.format(locale.config.tvc.texts.field_value, `<#${trigger.channel_id}>`, trigger.default.name, trigger.default.limit), true)
    }

    await message.channel.send(embed)
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const logs = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale)

    const embed = new MessageEmbed()

    for (const log_type of Object.keys(server.moderation.logs.types).filter(k => k != '$init').map(k => k)) {
        embed.addField(locale.modules.logs[log_type].title, server.moderation.logs.types[log_type].channel_id ? `${self._emojis.OK} <#${server.moderation.logs.types[log_type].channel_id}>` : self._emojis.ERROR, true)
    }

    await message.channel.send(embed)

    return true
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const levels = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const embed = new MessageEmbed()
        .setTitle(locale.config.levels.texts.levels)
        .setDescription(server.modules.levels.active ? self._emojis.OK : self._emojis.ERROR)

    if (server.modules.levels.allowed.channels.length || server.modules.levels.allowed.roles.length) {
        const array = [...server.modules.levels.allowed.channels.map(c => { return { t: 'C', id: c } }), ...server.modules.levels.allowed.roles.map(r => { return { t: 'R', id: r } })]
        embed.addField(locale.config.texts.active, TruncateArray(array.map(item => item.t == 'C' ? `<#${item.id}>` : `<@&${item.id}>`), 20, ' '))
    }

    if (server.modules.levels.blocked.channels.length || server.modules.levels.blocked.roles.length) {
        const array = [...server.modules.levels.blocked.channels.map(c => { return { t: 'C', id: c } }), ...server.modules.levels.blocked.roles.map(r => { return { t: 'R', id: r } })]
        embed.addField(locale.config.texts.inactive, TruncateArray(array.map(item => item.t == 'C' ? `<#${item.id}>` : `<@&${item.id}>`), 20, ' '))
    }
    
    embed.addField(locale.config.levels.texts.single_roles, server.modules.levels.single_roles ? self._emojis.OK : self._emojis.ERROR, true)
    embed.addField(locale.config.levels.texts.alerts, server.modules.levels.level_up_alerts.active ? `${self._emojis.OK} ${server.modules.levels.level_up_alerts.format == 1 ? `(${locale.config.levels.texts.alerts_dm})` : ''}` : self._emojis.ERROR, true)
    embed.addField(locale.config.levels.texts.alerts_template, TruncateString(server.modules.levels.level_up_alerts.message.content, 768) || '\u200B')
    embed.addField(locale.config.levels.texts.awards, TruncateArray(server.modules.levels.awards.map(a => `${self.translator.format(locale.config.levels.texts.award_level, a.level)} → <@&${a.references[0]}>`), 10, ', ') || '\u200B')
    
    await message.channel.send(embed)

    return true
}

module.exports = {
    fn: execute,
    name: 'config',
    description: 'commands.config.description',
    group: 'utility',
    subcommands: [
        {
            fn: reactions,
            name: 'reactions',
            description: 'commands.config.reactions.description'
        },
        {
            fn: tvc,
            name: 'tvc',
            description: 'commands.config.tvc.description'
        },
        {
            fn: logs,
            name: 'logs',
            description: 'commands.config.logs.description'
        },
        {
            fn: levels,
            name: 'levels',
            description: 'commands.config.levels.description'
        }
    ],
    guild_only: true,
    self_permissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
    user_permissions: ['ADMINISTRATOR']
}