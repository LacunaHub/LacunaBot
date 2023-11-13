import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Message, StringSelectMenuBuilder } from 'discord.js'
import { Queue } from 'erela.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { chunkArray, generateSimpleId } from '../../../internals/utility/Utils'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction) => {
    const t = self.i18n.t.bind(null, server.locale)

    const player = self.player.get(interaction.guild.id)

    if (!player) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.next.text_no_track_playback', {
                user: `**${(interaction.member as any).displayName}**`
            })}`,
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

    const chunks: Queue[] = chunkArray(player.queue, 25)
    let page: number = 0
    const selectMenuOptions = []

    for (const chunk of chunks) {
        const currentSelectMenuOptions = []

        for (const track of chunk) {
            currentSelectMenuOptions.push({
                label: track.title,
                value: `${track.identifier}:${generateSimpleId(6)}`,
                description: track.author
            })
        }

        selectMenuOptions.push(currentSelectMenuOptions)
    }

    const rows = [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('QUEUE-PREVIOUS-PAGE')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('◀️')
                .setDisabled(selectMenuOptions.length == 1),
            new ButtonBuilder()
                .setCustomId('QUEUE-PAGINATION')
                .setStyle(ButtonStyle.Secondary)
                .setLabel(t('commands.leaders.text_pagination', { current: page + 1, total: chunks.length }))
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('QUEUE-NEXT-PAGE')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('▶️')
                .setDisabled(selectMenuOptions.length == 1)
        )
    ]

    const message = (await interaction.editReply({
        components: [
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('QUEUE-SELECT-TRACK')
                    .setPlaceholder(t('commands.queue.text_select_playback_track'))
                    .addOptions(selectMenuOptions[page])
            ),
            ...rows
        ]
    })) as Message

    const collector = message.createMessageComponentCollector({
        filter: i => i.isStringSelectMenu() || i.isButton(),
        time: 60000
    })

    collector.on('collect', async i => {
        if (i.isStringSelectMenu() && i.customId === 'QUEUE-SELECT-TRACK') {
            await i.deferUpdate()

            const trackId = i.values[0]
            const trackIndex = player.queue.findIndex(j => j.identifier === trackId.split(':')[0])

            if (trackIndex !== -1) {
                if (player.queueRepeat) player.queue.add([player.queue.current, ...player.queue.slice(0, trackIndex)])
                await player.stop(trackIndex + 1)
                await i.deleteReply()
            }
        }

        if (i.isButton()) {
            switch (i.customId) {
                case 'QUEUE-PREVIOUS-PAGE':
                    page = page <= 0 ? selectMenuOptions.length - 1 : page - 1
                    break

                case 'QUEUE-NEXT-PAGE':
                    page = page + 1 >= selectMenuOptions.length ? 0 : page + 1
                    break
            }

            rows[0].components[1].setLabel(t('commands.leaders.text_pagination', { current: page + 1, total: chunks.length }))

            await i.deferUpdate()
            await i.editReply({
                components: [
                    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('QUEUE-SELECT-TRACK')
                            .setPlaceholder(t('commands.queue.text_select_playback_track'))
                            .addOptions(selectMenuOptions[page])
                    ),
                    ...rows
                ]
            })
        }

        collector.resetTimer()
    })

    return true
}
