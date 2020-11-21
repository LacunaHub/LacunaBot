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

    if (!server.modules.levels.active) return false

    const activity = await self.db.activities.find({ _id: message.guild.id })

    if (!activity) return false

    const sorted = activity.levels.sort((a, b) => b.experience.total - a.experience.total)
    const top10 = sorted.filter((el, i) => i < 9)

    const embed = new MessageEmbed()
        .setTitle(locale.leaders.texts.leaderboard)
        .setDescription(self.translator.format(locale.leaders.texts.positions, `\`${sorted.length}\``))

    for (const level of top10) {
        const index = sorted.indexOf(level)
        const user = await self.users.fetch(level.user_id, false)

        embed.addField(`#${index + 1} ${user ? user.username : '???'}`, `${self.translator.format(locale.config.levels.texts.award_level, level.experience.level)} → :sparkles: ${level.experience.current} (${level.experience.total})\n:incoming_envelope: ${level.activity.text.total_messages} (${self.translator.format(locale.leaders.texts.last_message_at, moment(level.activity.text.last_message_at || Date.now()).locale(server.locale).fromNow())})`)
    }

    const current_user_level = sorted.find(level => level.user_id == message.author.id)

    if (current_user_level) {
        const index = sorted.indexOf(current_user_level)

        embed.addField('\u200B', '\u200B')
        embed.addField(`#${index + 1} ${message.author.username}`, `${self.translator.format(locale.config.levels.texts.award_level, current_user_level.experience.level)} → :sparkles: ${current_user_level.experience.current} (${current_user_level.experience.total})\n:incoming_envelope: ${current_user_level.activity.text.total_messages} (${self.translator.format(locale.leaders.texts.last_message_at, moment(current_user_level.activity.text.last_message_at || Date.now()).locale(server.locale).fromNow())})`)
    }

    await message.channel.send(embed)

    return true
}

module.exports = {
    fn: execute,
    name: 'leaders',
    description: 'commands.leaders.description',
    group: 'general',
    aliases: ['top'],
    guild_only: true,
    self_permissions: ['SEND_MESSAGES', 'EMBED_LINKS']
}