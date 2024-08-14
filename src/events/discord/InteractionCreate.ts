import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { SearchResult } from '@lacunahub/lavaluna.js'
import {
    AnySelectMenuInteraction,
    AutocompleteInteraction,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    Events,
    Message,
    MessageContextMenuCommandInteraction,
    ModalSubmitInteraction,
    UserContextMenuCommandInteraction
} from 'discord.js'
import moment from 'moment'
import ms from 'ms'
import Lacuna from '../../internals/Lacuna'
import { onPressGiveawayButton } from '../../internals/structures/Giveaway'
import { lavalinkSources } from '../../internals/utility/Constants'
import { debounce, truncateString } from '../../internals/utility/Utils'
import Automation from '../../modules/Automation'
import CustomCommand from '../../modules/CustomCommand'
import InteractiveMessages from '../../modules/InteractiveMessages'
import { onPressChangeReasonButton, onSubmitChangeReasonModal } from '../../modules/Moderation/CaseLog'
import { onPressReportButton, onSelectReportOption } from '../../modules/Moderation/Reports'

const handler = async (
    self: Lacuna,
    interaction:
        | ChatInputCommandInteraction<'cached'>
        | UserContextMenuCommandInteraction<'cached'>
        | MessageContextMenuCommandInteraction<'cached'>
        | ButtonInteraction<'cached'>
        | AnySelectMenuInteraction<'cached'>
        | AutocompleteInteraction<'cached'>
        | ModalSubmitInteraction<'cached'>
) => {
    if (!interaction.inGuild() || interaction.inRawGuild()) return false

    if (interaction.isAutocomplete()) {
        return await handlerAutocomplete(self, interaction)
    }

    const server: ServerDocument = await self.db.servers.fetch({ _id: interaction.guildId })
    interaction.member = await interaction.guild.members.fetch(interaction.user.id)

    if (interaction.isChatInputCommand()) {
        const command = self.commands.find(v => v.name === interaction.commandName)
        const customCommand = server.modules.custom_commands.find(v => v.id === interaction.commandId)

        if (command) {
            await command.execute(server, interaction)
        }

        if (!command && customCommand) {
            const custom = new CustomCommand(customCommand, self, server, interaction)

            await custom.execute()
        }
    }

    if (interaction.isContextMenuCommand()) {
        const command = self.commands.find(
            v => (v.isUserContextCommand || v.isMessageContextCommand) && self.i18n.t('en', v.prettyName) === interaction.commandName
        )

        if (command) {
            await command.execute(server, interaction)
        }
    }

    if (interaction.isButton()) {
        if (/UD\-.*/.test(interaction.customId)) {
            await Automation.handleEvent('INTERACTION_BUTTON', self, server, interaction)
        }

        if (interaction.customId.startsWith('PLAYER')) {
            const player = self.lava.nodes.getPlayer(interaction.guild.id)
            const message = player?.get<Message>('message')

            if (message?.id === interaction.message?.id) {
                if (interaction.member.voice.channel?.id !== player.voiceChannelId) {
                    await interaction.reply({
                        content: `${self.staticEmojis.ERROR} | ${self.i18n.t(
                            server.locale,
                            'Commands.PlayCommand.Texts.YouAreNotConnectedToVoiceChannel',
                            {
                                username: `**${interaction.member.displayName}**`
                            }
                        )}`,
                        ephemeral: true
                    })

                    return false
                }

                const rows = message.components

                const shufflePlayButton = rows[0].components[0],
                    previousButton = rows[0].components[1],
                    playPauseButton = rows[0].components[2],
                    nextButton = rows[0].components[3],
                    repeatButton = rows[0].components[4]
                const volumeDownButton = rows[1].components[0],
                    seekBackwardButton = rows[1].components[1],
                    stopButton = rows[1].components[2],
                    seekForwardButton = rows[1].components[3],
                    volumeUpButton = rows[1].components[4]
                const queueButton = rows[2].components[0],
                    filtersButton = rows[2].components[1]

                if (interaction.customId === stopButton.customId) {
                    await self.commands.get('stop').execute(server, interaction as any)
                }

                if (interaction.customId === previousButton.customId) {
                    if (player.queue.previous && player.position < 5000) {
                        player.queue.position--
                        await player.play()
                    } else if (player.queue.current.info.isSeekable) {
                        await player.seek(0)
                    }
                }

                if (interaction.customId === playPauseButton.customId) {
                    await player.pause(!player.paused)
                    ;(playPauseButton as any).data.emoji = { name: player.paused ? '▶️' : '⏸️' }
                }

                if (interaction.customId === nextButton.customId) {
                    await player.stop()
                }

                if (interaction.customId === repeatButton.customId) {
                    if (player.queueRepeat) {
                        ;(repeatButton as any).data.emoji = { name: '🔂' }
                        player.setRepeatMode('TRACK')
                    } else if (player.trackRepeat) {
                        ;(repeatButton as any).data.emoji = { name: '➡️' }
                        player.setRepeatMode('OFF')
                    } else {
                        ;(repeatButton as any).data.emoji = { name: '🔁' }
                        player.setRepeatMode('QUEUE')
                    }
                }

                if (interaction.customId === queueButton.customId) {
                    await self.commands.get('queue').execute(server, interaction as any)
                }

                if ([volumeDownButton.customId, volumeUpButton.customId].includes(interaction.customId)) {
                    await self.commands.get('volume').execute(server, interaction as any)
                }

                if (interaction.customId === shufflePlayButton.customId) {
                    if (player.shufflePlay) {
                        ;(shufflePlayButton as any).data.style = ButtonStyle.Secondary
                        player.setShufflePlay(false)
                    } else {
                        ;(shufflePlayButton as any).data.style = ButtonStyle.Success
                        player.setShufflePlay(true)
                    }
                }

                if ([seekBackwardButton.customId, seekForwardButton.customId].includes(interaction.customId)) {
                    await self.commands.get('seek').execute(server, interaction as any)
                }

                if (interaction.customId === filtersButton.customId) {
                    await self.commands.get('filters').execute(server, interaction as any)
                }

                if (
                    ![
                        stopButton.customId,
                        queueButton.customId,
                        volumeDownButton.customId,
                        volumeUpButton.customId,
                        seekBackwardButton.customId,
                        seekForwardButton.customId,
                        filtersButton.customId
                    ].includes(interaction.customId)
                ) {
                    if (![previousButton.customId, nextButton.customId].includes(interaction.customId)) {
                        await message.edit({ components: rows })
                    }

                    await interaction.deferUpdate()
                }
            }

            return true
        }

        await InteractiveMessages.handleButtonClick(self, server, interaction)

        if (/GIVEAWAY\-\d+/.test(interaction.customId)) {
            await onPressGiveawayButton(self, server, interaction)

            return true
        }

        if (/R\-\w+\-\d+/.test(interaction.customId)) {
            await onPressReportButton(self, server, interaction)

            return true
        }

        if (/CL\-REASON\-\d+/.test(interaction.customId)) {
            await onPressChangeReasonButton(self, server, interaction)
        }
    }

    if (interaction.isAnySelectMenu()) {
        if (/UD\-.*/.test(interaction.customId) && interaction.isStringSelectMenu()) {
            await Automation.handleEvent('INTERACTION_SELECT_MENU', self, server, interaction)
        }

        await InteractiveMessages.handleSelectMenuSelection(self, server, interaction)

        if (interaction.isStringSelectMenu() && /R\-\w+\-\d+/.test(interaction.customId)) {
            await onSelectReportOption(self, server, interaction)

            return true
        }
    }

    if (interaction.isModalSubmit()) {
        if (/UD\-.*/.test(interaction.customId)) {
            await Automation.handleEvent('INTERACTION_MODAL_SUBMIT', self, server, interaction)
        }

        if (/CL\-REASON\-\d+/.test(interaction.customId)) {
            await onSubmitChangeReasonModal(self, server, interaction)
        }

        if (/REPORT\-\d+/.test(interaction.customId)) {
            const reportCommand = self.commands.get('report')
            await reportCommand.execute(server, interaction as any)
        }
    }

    return true
}

const handlerAutocomplete = debounce(async (self: Lacuna, interaction: AutocompleteInteraction) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: interaction.guildId })
    const option = interaction.options?.getFocused?.(true)

    if (interaction.commandName === 'help') {
        const commands = self.commands.filter(i => i.name.includes(option?.value))

        await interaction.respond(
            commands
                .map(i => {
                    return {
                        name: `${i.name} - ${self.i18n.t(interaction.locale, i.description)}`,
                        value: i.name
                    }
                })
                .slice(0, 25)
        )
    }

    if (interaction.commandName === 'store') {
        const items = server.modules.economy.store.items
            .slice(0, server.premium.available ? 200 : 50)
            .filter(i => [i.id, i.name, i.description].some(ii => ii.includes(option?.value)))

        await interaction.respond(
            items
                .map(i => {
                    const currency = server.modules.economy.currencies.find(ii => ii.id === i.currency_id)
                    const price = `${i.purchase_price} ${currency.name}`

                    return {
                        name: `${i.name} (${price})`,
                        value: i.id
                    }
                })
                .slice(0, 25)
        )
    }

    if (['wallet', 'activities'].includes(interaction.commandName)) {
        if (option?.name === 'currency') {
            const currencies = server.modules.economy.currencies.filter(i => [i.id, i.name, i.symbol].some(ii => ii.includes(option?.value)))

            await interaction.respond(
                currencies.map(i => {
                    return {
                        name: i.name,
                        value: i.id
                    }
                })
            )
        }

        if (option?.name === 'award') {
            const awards = server.modules.levels.awards.filter(v => [v.id, v.references.join()].some(vv => vv.includes(option?.value)))

            await interaction.respond(
                awards
                    .map(v => {
                        return {
                            name: truncateString(v.references.map(vv => interaction.guild.roles.cache.get(vv)?.name ?? vv).join(', ')),
                            value: v.id
                        }
                    })
                    .slice(0, 25)
            )
        }
    }

    if (['ban', 'mute', 'giveaway', 'temprole'].includes(interaction.commandName) && option?.name === 'duration') {
        const timeouts = ['1m', '5m', '10m', '30m', '1h', '2h', '5h', '12h', '24h', '2d', '1w', '2w', '4w']
        let duration = option?.value && ms(option.value) ? ms(option.value) : null

        if (duration) {
            await interaction.respond([
                {
                    name: moment(Date.now() + duration)
                        .locale(server.locale)
                        .fromNow(true),
                    value: ms(duration)
                }
            ])
        } else {
            await interaction.respond(
                timeouts.map(v => {
                    return {
                        name: moment(Date.now() + ms(v))
                            .locale(server.locale)
                            .fromNow(true),
                        value: v
                    }
                })
            )
        }
    }

    if (interaction.commandName === 'unban') {
        if (interaction.guild.bans.cache.size < 100) {
            await interaction.guild.bans.fetch({ limit: 100, cache: true })
        }

        const bans = interaction.guild.bans.cache.filter(i => [i.user.id, i.user.tag].some(ii => ii.includes(option?.value)))

        await interaction.respond(
            bans
                .map(i => {
                    return {
                        name: i.user.tag,
                        value: i.user.id
                    }
                })
                .slice(0, 25)
        )
    }

    if (interaction.commandName === 'play') {
        if (!option?.value) {
            await interaction.respond([])

            return false
        }

        const is_url = new RegExp(`^https?:\/\/`).test(option?.value)
        const { allowedMusicHosts } = await self.db.getInternalData()

        if (is_url && !allowedMusicHosts.some(h => option?.value?.startsWith?.(h))) {
            await interaction.respond([])

            return false
        }

        let search: SearchResult

        try {
            search = await self.lava.search(
                { query: option?.value, source: lavalinkSources[server.modules.music.default_source] },
                { maxResults: 25 }
            )
        } catch (err) {
            await interaction.respond([])

            return false
        }

        if (['error', 'empty'].includes(search.loadType)) {
            await interaction.respond([])

            return false
        }

        if (search.loadType === 'playlist') {
            await interaction.respond([
                {
                    name: truncateString(search.playlist.name, 95),
                    value: option?.value
                }
            ])

            return true
        }

        const tracks = search.tracks.map(i => {
            const trackName = truncateString(`${i.info.author} - ${i.info.title}`, 95)

            return {
                name: trackName,
                value: i.info.uri
            }
        })

        await interaction.respond(tracks)
    }
}, 1000)

export default {
    name: Events.InteractionCreate,
    handler
}
