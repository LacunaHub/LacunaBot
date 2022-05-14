import { CommandInteraction, Message, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js'
import { Queue } from 'erela.js'
import numbro from 'numbro'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { chunkArray } from '../../../internals/utility/Utils'

export default async (self: Lacuna, server: ServerDocument, interaction: CommandInteraction) => {
    const locale = self.translator.locale(server.locale).commands

    const player = self.player.get(interaction.guild.id)

    if (!player || !player.queue.size) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.stop.texts.no_track_playback, `**${(interaction.member as any).displayName}**`)}`,
            ephemeral: true
        })

        return false
    }

    const chunks: Queue[] = chunkArray(player.queue, 15)
    let page: number = 0

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

    const row = new MessageActionRow().addComponents(
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

    const message = (await interaction.editReply({
        embeds: [embed.setFields(fields[page]).setFooter({ text: self.translator.format(locale.leaders.texts.pagination, page + 1, chunks.length) })],
        components: [row]
    })) as Message

    const collector = message.createMessageComponentCollector({
        componentType: 'BUTTON',
        filter: i => row.components.some(c => c.customId == i.customId),
        time: 30000
    })

    collector.on('collect', async i => {
        switch (i.customId) {
            case row.components[0].customId:
                page = page <= 0 ? fields.length - 1 : page - 1
                break

            case row.components[1].customId:
                page = page + 1 >= fields.length ? 0 : page + 1
                break
        }

        await i.deferUpdate()
        await i
            .editReply({
                embeds: [embed.setFields(fields[page]).setFooter({ text: self.translator.format(locale.leaders.texts.pagination, page + 1, chunks.length) })],
                components: [row]
            })
            .catch(() => {})

        collector.resetTimer()
    })

    return true
}
