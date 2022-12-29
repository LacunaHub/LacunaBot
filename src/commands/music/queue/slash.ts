import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ComponentType, EmbedBuilder, Message } from 'discord.js'
import { Queue } from 'erela.js'
import numbro from 'numbro'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { chunkArray } from '../../../internals/utility/Utils'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction) => {
    const t = self.i18n.t.bind(null, server.locale)

    const player = self.player.get(interaction.guild.id)

    if (!player) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.next.text_no_track_playback', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (!player.queue.size) {
        await interaction.reply({
            content: `${self._emojis.OK} | ${t('commands.queue.text_no_track_queue', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return true
    }

    await interaction.deferReply({ ephemeral: true })

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

    const embed = new EmbedBuilder()

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('backward')
            .setStyle(ButtonStyle.Secondary)
            .setLabel(t('commands.leaders.text_previous_page'))
            .setDisabled(fields.length == 1),
        new ButtonBuilder()
            .setCustomId('forward')
            .setStyle(ButtonStyle.Secondary)
            .setLabel(t('commands.leaders.text_next_page'))
            .setDisabled(fields.length == 1)
    )

    const message = (await interaction.editReply({
        embeds: [embed.setFields(fields[page]).setFooter({ text: t('commands.leaders.text_pagination', { current: page + 1, total: chunks.length }) })],
        components: [row]
    })) as Message

    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 30000
    })

    collector.on('collect', async i => {
        switch (i.customId) {
            case 'backward':
                page = page <= 0 ? fields.length - 1 : page - 1
                break

            case 'forward':
                page = page + 1 >= fields.length ? 0 : page + 1
                break
        }

        await i.deferUpdate()
        await i
            .editReply({
                embeds: [embed.setFields(fields[page]).setFooter({ text: t('commands.leaders.text_pagination', { current: page + 1, total: chunks.length }) })],
                components: [row]
            })
            .catch(() => {})

        collector.resetTimer()
    })

    return true
}
