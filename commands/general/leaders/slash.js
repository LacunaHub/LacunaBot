const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js')
const numbro = require('numbro')
const { chunkArray } = require('../../../internals/utility/Utils')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').CommandInteraction} interaction
 */
module.exports = async (self, server, interaction) => {
    const locale = self.translator.locale(server.locale).commands

    if (!server.modules.levels.active && !server.modules.levels.voice) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.rank.texts.levels_is_disabled, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    const activity = await self.db.activities.find({ _id: interaction.guild.id })

    if (!activity || !activity.levels.length) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.leaders.texts.no_activity, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    const sorted = activity.levels.sort((a, b) => b.experience.total - a.experience.total)
    /**
     * @type {Array<import('../../internals/Typings').LevelActivities[]>}
     */
    const chunks = chunkArray(sorted, 15)
    let page = 0

    const embed = new MessageEmbed()
        .setTitle(locale.leaders.texts.leaderboard)

    const fields = []

    for (const chunk of chunks) {
        const current = []

        for (const level of chunk) {
            const index = sorted.indexOf(level)

            /**
             * @type {import('discord.js').GuildMember}
             */
            const member = await interaction.guild.members._fetchSingle({ user: level.user_id, cache: false })

            const current_xp_format = level.experience.current >= 1000 ? numbro(Math.floor(level.experience.current)).format({ average: true, mantissa: 1 }).toUpperCase() : level.experience.current.toFixed(1)
            const total_xp_format = level.experience.total >= 1000 ? numbro(Math.floor(level.experience.total)).format({ average: true, mantissa: 1 }).toUpperCase() : level.experience.total.toFixed(1)
            const voice_time = numbro(level.activity.voice.total_time).format({ output: 'time' })

            current.push({
                name: `#${index + 1} ${member?.displayName ?? '???'}`,
                value: `${self.translator.format(locale.leaders.texts.level, level.experience.level)} → :sparkles: ${current_xp_format} – ${total_xp_format}\n:incoming_envelope: ${level.activity.text.total_messages} :microphone2: ${voice_time}`,
                inline: true
            })
        }

        fields.push(current)
    }

    if (!interaction.deferred) await interaction.deferReply({ ephemeral: true })

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

    /**
     * @type {import('discord.js').Message}
     */
    const message = await interaction.editReply({
        embeds: [ embed.setFields(fields[page]).setFooter(self.translator.format(locale.leaders.texts.pagination, (page + 1), chunks.length)) ],
        components: [row]
    })

    const collector = message.createMessageComponentCollector({
        filter: i => row.components.some(c => c.customId == i.customId),
        time: 30000
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

        await i.deferUpdate()
        await i.editReply({
            embeds: [ embed.setFields(fields[page]).setFooter(self.translator.format(locale.leaders.texts.pagination, (page + 1), chunks.length)) ],
            components: [row]
        })

        collector.resetTimer()
    })

    return true
}