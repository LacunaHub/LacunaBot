import { ActionRowBuilder, ButtonInteraction, ChatInputCommandInteraction, Message, StringSelectMenuBuilder } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'> | ButtonInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)
    const player = self.player.get(interaction.guild.id)

    if (!player) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.next.text_no_track_playback', {
                user: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (player.voiceChannelId !== interaction.member.voice.channelId) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.next.text_different_voice', { user: `**${interaction.member.displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    const filters = {
        slowed: {
            label: 'Slowed',
            description: 'Reduce the tempo',
            filter: {
                timescale: {
                    speed: 0.8,
                    pitch: 0.8,
                    rate: 1.1
                }
            }
        },
        nightcore: {
            label: 'Nightcore',
            description: 'Increase the pitch and speed up',
            filter: {
                timescale: {
                    speed: 1.2,
                    pitch: 1.2,
                    rate: 1.0
                }
            }
        },
        karaoke: {
            label: 'Karaoke',
            description: 'Eliminate vocals',
            filter: {
                karaoke: {
                    level: 1.0,
                    monoLevel: 1.0,
                    filterBand: 220.0,
                    filterWidth: 100.0
                }
            }
        },
        eightD: {
            label: '8D',
            description: 'Rotate the sound around the stereo channels',
            filter: {
                rotation: {
                    rotationHz: 0.3
                }
            }
        }
    }

    await interaction.deferReply({ ephemeral: true })

    const message = (await interaction.editReply({
        components: [
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('FILTERS-SELECT')
                    .setPlaceholder('Выберите фильтр')
                    .setMaxValues(Object.keys(filters).length)
                    .addOptions([
                        {
                            label: 'Off',
                            description: 'Turn off all filters',
                            value: 'off'
                        },
                        ...Object.keys(filters).map(v => ({ label: filters[v].label, description: filters[v].description, value: v }))
                    ])
            )
        ]
    })) as Message

    const collector = message.createMessageComponentCollector({
        filter: i => i.isStringSelectMenu(),
        time: 60000
    })

    collector.on('collect', async i => {
        if (i.isStringSelectMenu() && i.customId === 'FILTERS-SELECT') {
            await i.deferUpdate()

            if (i.values.includes('off')) {
                await player.setFilters({})
            } else {
                await player.setFilters(
                    i.values.reduce((x, y) => {
                        x = { ...x, ...filters[y].filter }
                        return x
                    }, {})
                )
            }

            await i.deleteReply()
        }

        collector.resetTimer()
    })

    return true
}
