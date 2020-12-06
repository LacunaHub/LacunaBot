const { MessageEmbed } = require('discord.js')
const moment = require('moment')

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

    if (!member) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.violations.texts.user_not_found, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const violator = server.moderation.warnings.violators.find(v => v.user_id == member.id)

    if (!violator || !violator.violations.length) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.violations.texts.no_violations, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const last_24_hours = violator.violations.filter(v => (Date.now() - v.timestamp) < 86400000)
    const last_7_days = violator.violations.filter(v => (Date.now() - v.timestamp) < 604800000)
    const last_10_violations = violator.violations.slice(Math.max(violator.violations.length - 10, 0)).sort((a, b) => b.timestamp - a.timestamp)

    const embed = new MessageEmbed()
        .setAuthor(self.translator.format(locale.violations.texts.title, member.user.tag), member.user.displayAvatarURL())
        .addField(locale.violations.texts.last_24_hours, last_24_hours.length, true)
        .addField(locale.violations.texts.last_7_days, last_7_days.length, true)
        .addField(locale.violations.texts.total, violator.violations.length, true)
        .addField(locale.violations.texts.last_10_violations, last_10_violations.map(v => `**${v.reason || locale.common.texts.none}** – ${moment(v.timestamp).locale(server.locale).fromNow()}: \`${v.id}\``))

    await message.reply({ embed: embed, allowedMentions: { repliedUser: false } })

    return true
}

module.exports = {
    fn: execute,
    name: 'violations',
    description: 'commands.violations.description',
    aliases: ['viols'],
    group: 'moderation',
    guild_only: true,
    self_permissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
    user_permissions: ['MANAGE_ROLES']
}