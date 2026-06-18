import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import {
    ActionRowBuilder,
    ButtonInteraction,
    ChatInputCommandInteraction,
    Message,
    StringSelectMenuBuilder
} from 'discord.js'

export default async (
    self: Lacuna,
    server: ServerDocument,
    interaction: ChatInputCommandInteraction<'cached'> | ButtonInteraction<'cached'>
) => {
    const t = self.i18n.t.bind(null, server.locale)
    const player = self.lava!.nodes.getPlayer(interaction.guild.id)

    if (!player) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.PlayCommand.Texts.PlaybackIsNotStarted', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (player.voiceChannelId !== interaction.member.voice.channelId) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.PlayCommand.Texts.YouAreNotConnectedToVoiceChannel', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    const filters = {
        slowed: {
            label: 'Slowed',
            description: t('Commands.FilterCommand.Texts.FilterSlowed'),
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
            description: t('Commands.FilterCommand.Texts.FilterNightcore'),
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
            description: t('Commands.FilterCommand.Texts.FilterKaraoke'),
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
            description: t('Commands.FilterCommand.Texts.FilterEightD'),
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
                    .setPlaceholder(t('Commands.FilterCommand.Texts.SelectFilter'))
                    .setMaxValues(Object.keys(filters).length)
                    .addOptions([
                        {
                            label: 'Off',
                            description: t('Commands.FilterCommand.Texts.TurnOffAllFilters'),
                            value: 'off'
                        },
                        ...Object.keys(filters).map(v => ({
                            label: (filters as any)[v].label,
                            description: (filters as any)[v].description,
                            value: v
                        }))
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
                        x = { ...x, ...(filters as any)[y].filter }
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
