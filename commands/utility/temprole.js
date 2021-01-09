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

    const mention = message.mentions.users.first() || args[0]
    const member = mention ? await message.guild.members.fetch({ user: mention, cache: false }) : null
    let timer = args[1]
    const raw_role = args.slice(2).join(' ')
    const role = message.mentions.roles.first() || message.guild.roles.cache.find(r => r.id == raw_role || r.name == raw_role)

    if (!member || !timer || !role) {
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

    const has_role = self.temproles.some(r => r.user_id == member.id && r.role_id == role.id)
    if (has_role) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.temprole.texts.has_role, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (timer < ms('1m')) timer = ms('1m')
    else if (timer > ms('2y')) timer = ms('2y')

    await member.roles.add(role.id)

    new TemporaryRole(self, {
        user_id: member.id,
        guild_id: message.guild.id,
        role_id: role.id,
        unique_id: id.simple(6),
        expires_timestamp: Date.now() + timer,
        init: true
    })

    await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.temprole.texts.success, `**${message.author.username}**`, `**${member.user.tag}**`, moment(Date.now() + timer).locale(server.locale).endOf().fromNow())}`, { allowedMentions: { repliedUser: false } })

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