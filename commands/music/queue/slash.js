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

    const player = self.player.get(interaction.guild.id)

    if (!player || !player.queue.size) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.stop.texts.no_track_playback, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    /**
     * @type {Array<import('erela.js').Queue>}
     */
    const chunks = chunkArray(player.queue, 15)
    let page = 0

    const fields = []

    for (const chunk of chunks) {
        const current = []

        for (const track of chunk) {
            current.push({
                name: track.author,
                value: `${track.title} \`[${numbro(track.duration / 1000).format({ output: 'time' })}]\``,
                inline: false
            })
        }

        fields.push(current)
    }

    const embed = new MessageEmbed()

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
        }).catch(() => {})

        collector.resetTimer()
    })

    return true
}