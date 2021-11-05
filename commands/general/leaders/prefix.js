const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js')
const numbro = require('numbro')
const { chunkArray, isSnowflake } = require('../../../internals/utility/Utils')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 */
module.exports = async (self, server, message) => {
    const locale = self.translator.locale(server.locale).commands

    if (!server.modules.levels.active && !server.modules.levels.voice) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.rank.texts.levels_is_disabled, `**${message.member.displayName}**`)}` })

        return false
    }

    const activity = await self.db.activities.find({ _id: message.guild.id })

    if (!activity || !activity.levels.length) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.leaders.texts.no_activity, `**${message.member.displayName}**`)}` })

        return false
    }

    const sorted = activity.levels.sort((a, b) => b.experience.total - a.experience.total)
    /**
     * @type {Array<import('../../internals/Typings').LevelActivities[]>}
     */
    const chunks = chunkArray(sorted, 9)
    let page = 0

    const embed = new MessageEmbed()
        .setTitle(locale.leaders.texts.leaderboard)

    const fields = []

    for (const chunk of chunks) {
        const current = []

        for (const level of chunk) {
            const index = sorted.indexOf(level)

            const current_xp_format = level.experience.current >= 1000 ? numbro(Math.floor(level.experience.current)).format({ average: true, mantissa: 1 }).toUpperCase() : level.experience.current.toFixed(1)
            const total_xp_format = level.experience.total >= 1000 ? numbro(Math.floor(level.experience.total)).format({ average: true, mantissa: 1 }).toUpperCase() : level.experience.total.toFixed(1)
            const voice_time = numbro(level.activity.voice.total_time).format({ output: 'time' })

            current.push({
                name: `#${index + 1} ${level.user_id}`,
                value: `${self.translator.format(locale.leaders.texts.level, level.experience.level)} → :sparkles: ${current_xp_format} – ${total_xp_format}\n:incoming_envelope: ${level.activity.text.total_messages} :microphone2: ${voice_time}`,
                inline: true
            })
        }

        fields.push(current)
    }

    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('backward')
                .setStyle('SECONDARY')
                .setLabel('Previous')
                .setDisabled(fields.length == 1),
            new MessageButton()
                .setCustomId('forward')
                .setStyle('SECONDARY')
                .setLabel('Next')
                .setDisabled(fields.length == 1)
        )

    const field = fields[page]

    for (const chunk of field) {
        const [ index, user_id ] = chunk.name.split(' ')
        const member = isSnowflake(user_id) ? (await message.guild.members.fetch(user_id).catch(() => {})) : user_id

        chunk.name = `${index} ${member?.displayName ?? user_id}`
    }

    /**
     * @type {import('discord.js').Message}
     */
    const _message = await message.reply({
        embeds: [ embed.setFields(field).setFooter(self.translator.format(locale.leaders.texts.pagination, (page + 1), chunks.length)) ],
        components: [row]
    })

    const collector = _message.createMessageComponentCollector({
        filter: i => row.components.some(c => c.customId == i.customId) && i.user.id == message.author.id,
        time: 60000
    })

    collector.on('collect', async i => {
        switch (i.customId) {
            case row.components[0].customId:
                page = page <= 0 ? (fields.length - 1) : (page - 1)
            break

            case row.components[1].customId:
                page = (page + 1) >= fields.length ? 0 : (page + 1)
            break
        }

        const field = fields[page]

        for (const chunk of field) {
            const [ index, user_id ] = chunk.name.split(' ')
            const member = isSnowflake(user_id) ? (await message.guild.members.fetch(user_id).catch(() => {})) : user_id
    
            chunk.name = `${index} ${member?.displayName ?? user_id}`
        }

        await _message.edit({
            embeds: [ embed.setFields(field).setFooter(self.translator.format(locale.leaders.texts.pagination, (page + 1), chunks.length)) ],
            components: [row]
        })

        await i.deferUpdate()

        collector.resetTimer()
    })

    return true
}