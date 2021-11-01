const ms = require('ms')
const TemporaryRole = require('../../../internals/structures/TemporaryRole')
const id = require('../../../internals/utility/UID')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 */
module.exports = async (self, server, message) => {
    const locale = self.translator.locale(server.locale).commands

    const mention = message.mentions.members.first() || (message.args[0] ? (await message.guild.members.fetch(message.args[0])) : null)
    const role = message.mentions.roles.first() || message.guild.roles.cache.find(r => r.id == message.args[1] || r.name == message.args[1])
    let duration = message.args[2]

    duration = duration && ms(duration) ? ms(duration) : null

    if (!mention) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.temprole.texts.no_mention, `**${message.member.displayName}**`)}` })

        return false
    }

    if (!role) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.temprole.texts.no_role, `**${message.member.displayName}**`)}` })

        return false
    }

    if (!duration) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.temprole.texts.invalid_duration, `**${message.member.displayName}**`)}` })

        return false
    }

    if (!role.editable) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.temprole.texts.role_not_editable, `**${message.member.displayName}**`)}` })

        return false
    }

    const has_role = self.temproles.some(r => r.user_id == mention.id && r.role_id == role.id)

    if (has_role) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.temprole.texts.has_role, `**${message.member.displayName}**`)}` })

        return false
    }

    if (duration < ms('1m')) duration = ms('1m')
    else if (duration > ms('2y')) duration = ms('2y')

    const ts = Date.now() + duration

    await mention.roles.add(role.id)

    new TemporaryRole(self, {
        user_id: mention.id,
        guild_id: message.guild.id,
        role_id: role.id,
        unique_id: id.simple(6),
        expires_timestamp: ts,
        init: true
    })

    await message.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.temprole.texts.success, `**${message.member.displayName}**`, `**${role.name}**`, `**${mention.user.tag}**`, `<t:${Math.round(ts / 1000)}:D>`)}` })

    return true
}