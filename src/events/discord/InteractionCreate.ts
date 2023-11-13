import {
    AnySelectMenuInteraction,
    AutocompleteInteraction,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    ContextMenuCommandInteraction,
    Events,
    Message,
    ModalSubmitInteraction
} from 'discord.js'
import { SearchResult } from 'erela.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { onPressGiveawayButton } from '../../internals/structures/Giveaway'
import { lavalinkSources } from '../../internals/utility/Constants'
import { debounce, truncateString } from '../../internals/utility/Utils'
import Automation from '../../modules/Automation'
import CustomCommand from '../../modules/CustomCommand'
import InteractiveMessages from '../../modules/InteractiveMessages'
import { onPressChangeReasonButton, onSubmitChangeReasonModal } from '../../modules/Moderation/CaseLog'
import { createPoll, onPressPollButton } from '../../modules/Polls'
import { onPressReportButton, onSelectReportOption } from '../../modules/Reports'

const handler = async (
    self: Lacuna,
    interaction:
        | ChatInputCommandInteraction<'cached'>
        | ContextMenuCommandInteraction<'cached'>
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
        const command = self.commands.find(c => c.is_slash_command && c.name === interaction.commandName)
        const customCommand = server.modules.custom_commands.find(i => i.id === interaction.commandId)

        if (command) {
            await command.executeSlash(server, interaction)

            if (interaction.commandGuildId) {
                await self.updateApplicationCommands(server)
            }
        }

        if (!command && customCommand) {
            const custom = new CustomCommand(customCommand, self, server, interaction)

            await custom.execute()
        }
    }

    if (interaction.isContextMenuCommand()) {
        const command = self.commands.find(
            c => (c.is_message_command || c.is_user_command) && self.i18n.t('en', c.pretty_name) === interaction.commandName
        )

        if (command) {
            await command.executeContext(server, interaction)
        }
    }

    if (interaction.isButton()) {
        if (/UD\-.*/.test(interaction.customId)) {
            await Automation.handleEvent('INTERACTION_BUTTON', self, server, interaction)
        }

        if (interaction.customId.startsWith('PLAYER')) {
            const player = self.player.get(interaction.guild.id)
            const message = player?.get<Message>('message')

            if (message?.id === interaction.message?.id) {
                if (interaction.member.voice.channel?.id !== player.voiceChannelId) {
                    await interaction.reply({
                        content: `${self._emojis.ERROR} | ${self.i18n.t(server.locale, 'commands.next.text_different_voice', {
                            user: `**${interaction.member.displayName}**`
                        })}`,
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
                    await self.commands.get('stop').executeSlash(server, interaction as any)
                }

                if (interaction.customId === previousButton.customId) {
                    if (player.queue.previous && player.position < 5000) {
                        player.queue.add(player.queue.current, 0)
                        await player.play(player.queue.previous)
                    } else if (player.queue.current.isSeekable) {
                        await player.seek(0)
                    }
                }

                if (interaction.customId === playPauseButton.customId) {
                    await player.pause(!player.paused)
                    ;(playPauseButton as any).data.emoji = { name: player.paused ? '▶️' : '⏸️' }
                }

                if (interaction.customId === nextButton.customId) {
                    if (player.queueRepeat || player.trackRepeat) player.queue.add(player.queue.current)
                    await player.stop()
                }

                if (interaction.customId === repeatButton.customId) {
                    if (player.queueRepeat) {
                        ;(repeatButton as any).data.emoji = { name: '🔂' }
                        player.setQueueRepeat(false)
                        player.setTrackRepeat(true)
                    } else if (player.trackRepeat) {
                        ;(repeatButton as any).data.emoji = { name: '➡️' }
                        player.setTrackRepeat(false)
                        player.setQueueRepeat(false)
                    } else {
                        ;(repeatButton as any).data.emoji = { name: '🔁' }
                        player.setQueueRepeat(true)
                    }
                }

                if (interaction.customId === queueButton.customId) {
                    await self.commands.get('queue').executeSlash(server, interaction as any)
                }

                if ([volumeDownButton.customId, volumeUpButton.customId].includes(interaction.customId)) {
                    await self.commands.get('volume').executeSlash(server, interaction as any)
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
                    await self.commands.get('seek').executeSlash(server, interaction as any)
                }

                if (interaction.customId === filtersButton.customId) {
                    await self.commands.get('filters').executeSlash(server, interaction as any)
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

        if (/POLL\-\d+\-OPT\-\d+/.test(interaction.customId)) {
            await onPressPollButton(self, server, interaction)
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

        if (/POLL\-\d+\-(true|false)\-(true|false)/.test(interaction.customId)) {
            await createPoll(self, server, interaction)
        }

        if (/CL\-REASON\-\d+/.test(interaction.customId)) {
            await onSubmitChangeReasonModal(self, server, interaction)
        }

        if (/REPORT\-\d+/.test(interaction.customId)) {
            const reportCommand = self.commands.get('report')
            await reportCommand.executeSlash(server, interaction as any)
        }
    }

    return true
}

const handlerAutocomplete = debounce(async (self: Lacuna, interaction: AutocompleteInteraction) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: interaction.guildId })
    const query = interaction.options?.getFocused()

    if (interaction.commandName === 'help') {
        const commands = self.commands.filter(i => i.name.includes(query))

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
            .slice(0, server.server.premium.available ? 200 : 50)
            .filter(i => [i.id, i.name, i.description].some(ii => ii.includes(query)))

        await interaction.respond(
            items
                .map(i => {
                    const currency = server.modules.economy.currencies.find(ii => ii.id === i.currency_id)
                    const price = i.purchase_price
                        ? `${i.purchase_price} ${currency.name}`
                        : self.i18n.t(interaction.locale, 'commands.store.items.text_price_free')

                    return {
                        name: `${i.name} (${price})`,
                        value: i.id
                    }
                })
                .slice(0, 25)
        )
    }

    if (['wallet', 'activities'].includes(interaction.commandName)) {
        const currencies = server.modules.economy.currencies.filter(i => [i.id, i.name, i.symbol].some(ii => ii.includes(query)))

        await interaction.respond(
            currencies.map(i => {
                return {
                    name: i.name,
                    value: i.id
                }
            })
        )
    }

    if (interaction.commandName === 'unban') {
        if (interaction.guild.bans.cache.size < 100) {
            await interaction.guild.bans.fetch({ limit: 100, cache: true })
        }

        const bans = interaction.guild.bans.cache.filter(i => [i.user.id, i.user.tag].some(ii => ii.includes(query)))

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
        if (!query) {
            await interaction.respond([])

            return false
        }

        const is_url = new RegExp(`^https?:\/\/`).test(query)
        const { playableMusicHosts: allowed_hosts } = await self.db.json.get()

        if (is_url && !allowed_hosts.some(h => query.startsWith(h))) {
            await interaction.respond([])

            return false
        }

        let search: SearchResult

        try {
            search = await self.player.search({ query, source: lavalinkSources[server.modules.music.default_source] })
        } catch (err) {
            await interaction.respond([])

            return false
        }

        if (['LOAD_FAILED', 'NO_MATCHES'].includes(search.loadType)) {
            await interaction.respond([])

            return false
        }

        if (search.loadType === 'PLAYLIST_LOADED') {
            await interaction.respond([
                {
                    name: truncateString(search.playlist.name, 95),
                    value: query
                }
            ])

            return true
        }

        const tracks = search.tracks
            .map(i => {
                const trackName = truncateString(`${i.author} - ${i.title}`, 95)

                return {
                    name: trackName,
                    value: i.uri
                }
            })
            .slice(0, 25)

        await interaction.respond(tracks)
    }
}, 1000)

export default {
    name: Events.InteractionCreate,
    handler
}
