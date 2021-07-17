const { MessageEmbed } = require('discord.js')
const numbro = require('numbro')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    if (!server.modules.levels.active && !server.modules.levels.voice) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.rank.texts.levels_is_disabled, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const activity = await self.db.activities.find({ _id: message.guild.id })

    if (!activity || !activity.levels.length) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.leaders.texts.no_activity, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const sorted = activity.levels.sort((a, b) => b.experience.total - a.experience.total)
    const top = sorted.filter((el, i) => i <= 14)

    const embed = new MessageEmbed()
        .setTitle(locale.leaders.texts.leaderboard)
        .setDescription(self.translator.format(locale.leaders.texts.positions, `\`${sorted.length}\``))

    for (const level of top) {
        const index = sorted.indexOf(level)
        const user = await self.users.fetch(level.user_id, false)
        const current_xp_format = level.experience.current >= 1000 ? numbro(Math.floor(level.experience.current)).format({ average: true, mantissa: 1 }).toUpperCase() : level.experience.current.toFixed(1)
        const total_xp_format = level.experience.total >= 1000 ? numbro(Math.floor(level.experience.total)).format({ average: true, mantissa: 1 }).toUpperCase() : level.experience.total.toFixed(1)
        const voice_time = numbro(level.activity.voice.total_time).format({ output: 'time' })

        embed.addField(`#${index + 1} ${user ? user.username : '???'}`, `${self.translator.format(locale.config.levels.texts.award_level, level.experience.level)} → :sparkles: ${current_xp_format} – ${total_xp_format}\n:incoming_envelope: ${level.activity.text.total_messages} :microphone2: ${voice_time}`, true)
    }

    const current_user_level = sorted.find(level => level.user_id == message.author.id)

    if (current_user_level) {
        const index = sorted.indexOf(current_user_level)
        const current_xp_format = current_user_level.experience.current >= 1000 ? numbro(Math.floor(current_user_level.experience.current)).format({ average: true, mantissa: 1 }).toUpperCase() : current_user_level.experience.current.toFixed(1)
        const total_xp_format = current_user_level.experience.total >= 1000 ? numbro(Math.floor(current_user_level.experience.total)).format({ average: true, mantissa: 1 }).toUpperCase() : current_user_level.experience.total.toFixed(1)
        const voice_time = numbro(current_user_level.activity.voice.total_time).format({ output: 'time' })

        embed.addField('\u200B', '\u200B')
        embed.addField(`#${index + 1} ${message.author.username}`, `${self.translator.format(locale.config.levels.texts.award_level, current_user_level.experience.level)} → :sparkles: ${current_xp_format} – ${total_xp_format}\n:incoming_envelope: ${current_user_level.activity.text.total_messages} :microphone2: ${voice_time}`)
    }

    await message.reply({ embed: embed, allowedMentions: { repliedUser: false } })

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