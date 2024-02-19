import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    Message,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction
} from 'discord.js'
import { Queue } from 'lavaluna.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { chunkArray, generateSimpleId } from '../../../internals/utility/Utils'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)

    const player = self.lava.nodes.getPlayer(interaction.guild.id)

    if (!player) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('Commands.PlayCommand.Texts.PlaybackIsNotStarted', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (!player.queue.length) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('Commands.QueueCommand.Texts.PlaybackQueueIsEmpty', {
                username: `**${interaction.member.displayName}**`
            })}`,
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
            const isCurrent = player.queue.current.encoded === track.encoded

            currentSelectMenuOptions.push({
                label: track.info.title,
                value: `${track.info.identifier}:${generateSimpleId(6)}`,
                description: track.info.author,
                default: isCurrent
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
                .setLabel(t('Common.Pagination', { current: page + 1, total: chunks.length }))
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
                    .setPlaceholder(t('Commands.QueueCommand.Texts.SelectTrackToPlay'))
                    .addOptions(selectMenuOptions[page])
            ),
            ...rows
        ]
    })) as Message

    const collector = message.createMessageComponentCollector({
        filter: i => i.isStringSelectMenu() || i.isButton(),
        time: 60000
    })

    collector.on('collect', async (v: StringSelectMenuInteraction<'cached'> | ButtonInteraction<'cached'>) => {
        if (v.isStringSelectMenu() && v.customId === 'QUEUE-SELECT-TRACK') {
            await v.deferUpdate()

            const trackId = v.values[0],
                trackIndex = player.queue.findIndex(vv => vv.info.identifier === trackId.split(':')[0])

            if (trackIndex !== -1) {
                player.queue.position = trackIndex

                await player.play()
                await v.deleteReply()
            }
        }

        if (v.isButton()) {
            switch (v.customId) {
                case 'QUEUE-PREVIOUS-PAGE':
                    page = page <= 0 ? selectMenuOptions.length - 1 : page - 1
                    break

                case 'QUEUE-NEXT-PAGE':
                    page = page + 1 >= selectMenuOptions.length ? 0 : page + 1
                    break
            }

            rows[0].components[1].setLabel(t('Common.Pagination', { current: page + 1, total: chunks.length }))

            await v.deferUpdate()
            await v.editReply({
                components: [
                    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('QUEUE-SELECT-TRACK')
                            .setPlaceholder(t('Commands.QueueCommand.Texts.SelectTrackToPlay'))
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
