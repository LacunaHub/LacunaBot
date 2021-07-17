const ms = require('ms')
const moment = require('moment')
const TemporaryRole = require('../../internals/structures/TemporaryRole')
const id = require('../../internals/utility/UID')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    /**
     * @type {import('discord.js').GuildMember}
     */
    const mention = message.mentions.members.first() || (self.utils.isSnowflake(args[0]) ? await message.guild.members._fetchSingle({ user: args[0], cache: false }) : null)
    
    let timer = args[1]
    const raw_role = args.slice(2).join(' ')
    const role = message.mentions.roles.first() || message.guild.roles.cache.find(r => r.id == raw_role || r.name == raw_role)

    if (!mention || !timer || !role) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.temprole.texts.invalid_arguments, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (!ms(timer)) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.temprole.texts.invalid_timer, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    timer = ms(timer)

    if (!role.editable) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.temprole.texts.role_not_editable, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const has_role = self.temproles.some(r => r.user_id == mention.id && r.role_id == role.id)
    if (has_role) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.temprole.texts.has_role, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (timer < ms('1m')) timer = ms('1m')
    else if (timer > ms('2y')) timer = ms('2y')

    const ts = Date.now() + timer

    await mention.roles.add(role.id)

    new TemporaryRole(self, {
        user_id: mention.id,
        guild_id: message.guild.id,
        role_id: role.id,
        unique_id: id.simple(6),
        expires_timestamp: ts,
        init: true
    })

    await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.temprole.texts.success, `**${message.author.username}**`, `**${mention.user.tag}**`, `<t:${Math.round(ts / 1000)}:R>`)}`, { allowedMentions: { repliedUser: false } })

    return true
}

module.exports = {
    fn: execute,
    name: 'temprole',
    description: 'commands.temprole.description',
    group: 'utility',
    guild_only: true,
    self_permissions: ['SEND_MESSAGES'],
    user_permissions: ['MANAGE_ROLES']
}