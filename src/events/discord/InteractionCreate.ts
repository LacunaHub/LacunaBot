import {
    AnySelectMenuInteraction,
    AutocompleteInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    Collection,
    ContextMenuCommandInteraction,
    Events,
    GuildChannel,
    Message,
    ModalSubmitInteraction
} from 'discord.js'
import { SearchResult } from 'erela.js'
import { InteractiveMessageButtonComponent, InteractiveMessageSelectMenuComponent, ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { buttonPressed } from '../../internals/structures/Giveaway'
import { lavalinkSources } from '../../internals/utility/Constants'
import { snakeToPascalCase, truncateString } from '../../internals/utility/Utils'
import CustomCommand from '../../modules/CustomCommand'
import { onPressChangeReasonButton, onSubmitChangeReasonModal } from '../../modules/Moderation/CaseLog'
import { createPoll, onPressPollButton } from '../../modules/Polls'
import Replacer from '../../modules/Replacer'
import reports from '../../modules/Reports'

const handler = async (
    self: Lacuna,
    interaction:
        | ChatInputCommandInteraction
        | ContextMenuCommandInteraction
        | ButtonInteraction
        | AnySelectMenuInteraction
        | AutocompleteInteraction
        | ModalSubmitInteraction
) => {
    if (!interaction.inGuild() || interaction.inRawGuild()) return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: interaction.guildId })
    interaction.member = await interaction.guild.members.fetch(interaction.user.id)

    if (interaction.isChatInputCommand()) {
        const command = self.commands.find(c => c.is_slash_command && c.name == interaction.commandName)
        const customCommand = server.modules.custom_commands.find(i => i.id === interaction.commandId)

        if (command) await command.executeSlash(server, interaction)
        if (!command && customCommand) {
            const custom = new CustomCommand(customCommand, self, server, interaction)

            await custom.execute()
        }
    }

    if (interaction.isContextMenuCommand()) {
        const command = self.commands.find(
            c => (c.is_message_command || c.is_user_command) && self.i18n.t(server.locale, c.pretty_name) == interaction.commandName
        )

        if (command) await command.executeContext(server, interaction)
    }

    if (interaction.isButton()) {
        if (/GIVEAWAY\-\d+/.test(interaction.customId)) {
            await buttonPressed(self, server, interaction)

            return true
        }

        if (/R\-\w+\-\d+/.test(interaction.customId)) {
            await reports.buttonPressed(self, server, interaction)

            return true
        }

        if (interaction.customId.startsWith('PLAYER')) {
            const player = self.player.get(interaction.guild.id)
            const message = player?.get<Message>('message')

            if (message?.id === interaction.message?.id) {
                if (interaction.member.voice.channel?.id !== player.voiceChannel) {
                    await interaction.reply({
                        content: `${self._emojis.ERROR} | ${self.i18n.t(server.locale, 'commands.next.text_different_voice', {
                            user: `**${interaction.member.displayName}**`
                        })}`,
                        ephemeral: true
                    })

                    return false
                }

                const rows = message.components

                const stopButton = rows[0].components[0]
                const previousButton = rows[0].components[1]
                const playPauseButton = rows[0].components[2]
                const nextButton = rows[0].components[3]
                const repeatButton = rows[0].components[4]
                const queueButton = rows[1].components[0]
                const volumeDownButton = rows[1].components[1]
                const volumeUpButton = rows[1].components[2]

                if (interaction.customId === stopButton.customId) {
                    await self.commands.get('stop').executeSlash(server, interaction as any)
                }

                if (interaction.customId === previousButton.customId) {
                    if (player.queue.previous && player.position < 5000) {
                        player.queue.add(player.queue.current, 0)
                        await player.play(player.queue.previous)
                    } else if (player.queue.current.isSeekable) player.seek(0)
                }

                if (interaction.customId === playPauseButton.customId) {
                    player.pause(!player.paused)
                    ;(playPauseButton as any).data.emoji = { name: player.paused ? '▶️' : '⏸️' }
                }

                if (interaction.customId === nextButton.customId) {
                    if (player.queueRepeat) player.queue.add(player.queue.current)
                    player.stop()
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

                if (![stopButton.customId, queueButton.customId, volumeDownButton.customId, volumeUpButton.customId].includes(interaction.customId)) {
                    if (![previousButton.customId, nextButton.customId].includes(interaction.customId)) {
                        await message.edit({ components: rows })
                    }

                    await interaction.deferUpdate()
                }
            }

            return true
        }

        const im = server.modules.interactive_messages.slice(0, server.server.premium.available ? 50 : 5).find(i => i.id === interaction.message.id)

        if (im) {
            await interaction.deferUpdate()

            const buttons = im.components.flat().filter(i => i.type == 'BUTTON')
            const button = buttons.find(i => i.id == interaction.customId) as InteractiveMessageButtonComponent

            if (button.options.includes('RESTRICT_ROLES') && Array.isArray(button.restricted_roles)) {
                if (interaction.member.roles.cache.some(i => button.restricted_roles.includes(i.id))) return false
            }

            if (button?.options?.includes('EPHEMERAL_REPLY') && button?.ephemeral_reply) {
                const replacer = new Replacer(null, { guild: interaction.guild, member: interaction.member as any })
                const content = await replacer.replaceTemplateMessage(button.ephemeral_reply)

                await interaction.followUp({ ...content, ephemeral: true }).catch(() => {})
            }

            if (button?.options?.includes('MODIFY_ROLES') && button?.modify_roles) {
                const addRoles = interaction.guild.roles.cache.filter(i => i.editable && button.modify_roles.add.includes(i.id)).first(8)
                const removeRoles = interaction.guild.roles.cache.filter(i => i.editable && button.modify_roles.remove.includes(i.id)).first(8)

                if (addRoles.length) {
                    const hasRoles = button.modify_roles.reversible_add && interaction.member.roles.cache.hasAny(...addRoles.map(i => i.id))

                    if (hasRoles) await interaction.member.roles.remove(addRoles).catch(() => {})
                    else await interaction.member.roles.add(addRoles).catch(() => {})
                }

                if (removeRoles.length) {
                    const missingRoles =
                        button.modify_roles.reversible_remove && !interaction.member.roles.cache.hasAll(...removeRoles.map(i => i.id))

                    if (missingRoles) await interaction.member.roles.add(removeRoles).catch(() => {})
                    else await interaction.member.roles.remove(removeRoles).catch(() => {})
                }
            }

            if (button?.options?.includes('OVERWRITE_CHANNEL_PERMISSIONS') && button?.overwrite_channel_permissions) {
                // prettier-ignore
                const channels = interaction.guild.channels.cache.filter(i => i.manageable && button.overwrite_channel_permissions.channels.includes(i.id)) as Collection<string, GuildChannel>

                for (const channel of channels.first(8)) {
                    const overwrites = channel.permissionOverwrites.cache.get(interaction.user.id)

                    if (overwrites && button.overwrite_channel_permissions.reversible) {
                        await overwrites.delete().catch(() => {})
                    } else {
                        const overwriteOptions = Object.keys(button.overwrite_channel_permissions.permissions).reduce((obj, k) => {
                            obj[snakeToPascalCase(k)] = button.overwrite_channel_permissions.permissions[k]
                            return obj
                        }, {})

                        await channel.permissionOverwrites.create(interaction.user.id, overwriteOptions).catch(() => {})
                    }
                }
            }
        }

        if (/POLL\-\d+\-OPT\-\d+/.test(interaction.customId)) {
            await onPressPollButton(self, server, interaction)
        }

        if (/CL\-REASON\-\d+/.test(interaction.customId)) {
            await onPressChangeReasonButton(self, server, interaction)
        }
    }

    if (interaction.isAnySelectMenu()) {
        if (interaction.isStringSelectMenu() && /R\-\w+\-\d+/.test(interaction.customId)) {
            await reports.optionSelected(self, server, interaction)

            return true
        }

        const im = server.modules.interactive_messages.slice(0, server.server.premium.available ? 50 : 5).find(i => i.id == interaction.message.id)

        if (im) {
            await interaction.deferUpdate()

            const selects = im.components.flat().filter(i => i.type == 'SELECT_MENU')
            const select = selects.find(i => i.id == interaction.customId) as InteractiveMessageSelectMenuComponent
            const value = interaction.values[0]

            const option = select?._options?.find(i => i.appearance.value == value)

            if (option.options.includes('RESTRICT_ROLES') && Array.isArray(option.restricted_roles)) {
                if (interaction.member.roles.cache.some(i => option.restricted_roles.includes(i.id))) return false
            }

            if (option?.options.includes('EPHEMERAL_REPLY') && option.ephemeral_reply) {
                const replacer = new Replacer(null, { guild: interaction.guild, member: interaction.member as any })
                const content = await replacer.replaceTemplateMessage(option.ephemeral_reply)

                await interaction.followUp({ ...content, ephemeral: true }).catch(() => {})
            }

            if (option?.options?.includes('MODIFY_ROLES') && option?.modify_roles) {
                const addRoles = interaction.guild.roles.cache.filter(i => i.editable && option.modify_roles.add.includes(i.id)).first(8)
                const removeRoles = interaction.guild.roles.cache.filter(i => i.editable && option.modify_roles.remove.includes(i.id)).first(8)

                if (addRoles.length) {
                    const hasRoles = option.modify_roles.reversible_add && interaction.member.roles.cache.hasAny(...addRoles.map(i => i.id))

                    if (hasRoles) await interaction.member.roles.remove(addRoles).catch(() => {})
                    else await interaction.member.roles.add(addRoles).catch(() => {})
                }

                if (removeRoles.length) {
                    const missingRoles =
                        option.modify_roles.reversible_remove && !interaction.member.roles.cache.hasAll(...removeRoles.map(i => i.id))

                    if (missingRoles) await interaction.member.roles.add(removeRoles).catch(() => {})
                    else await interaction.member.roles.remove(removeRoles).catch(() => {})
                }
            }

            if (option?.options?.includes('OVERWRITE_CHANNEL_PERMISSIONS') && option?.overwrite_channel_permissions) {
                // prettier-ignore
                const channels = interaction.guild.channels.cache.filter(i => i.manageable && option.overwrite_channel_permissions.channels.includes(i.id)) as Collection<string, GuildChannel>

                for (const channel of channels.first(8)) {
                    const overwrites = channel.permissionOverwrites.cache.get(interaction.user.id)

                    if (overwrites && option.overwrite_channel_permissions.reversible) {
                        await overwrites.delete().catch(() => {})
                    } else {
                        const overwriteOptions = Object.keys(option.overwrite_channel_permissions.permissions).reduce((obj, k) => {
                            obj[snakeToPascalCase(k)] = option.overwrite_channel_permissions.permissions[k]
                            return obj
                        }, {})

                        await channel.permissionOverwrites.create(interaction.user.id, overwriteOptions).catch(() => {})
                    }
                }
            }
        }
    }

    if (interaction.isAutocomplete()) {
        const query = interaction.options?.getFocused()

        if (interaction.commandName === 'help') {
            const commands = self.commands.filter(i => i.name.includes(query))

            await interaction.respond(
                commands
                    .map(i => {
                        return {
                            name: `${i.name} - ${self.i18n.t(server.locale, i.description)}`,
                            value: i.name
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
    }

    if (interaction.isModalSubmit()) {
        if (/POLL\-\d+\-(true|false)\-(true|false)/.test(interaction.customId)) {
            await createPoll(self, server, interaction)
        }

        if (/CL\-REASON\-\d+/.test(interaction.customId)) {
            await onSubmitChangeReasonModal(self, server, interaction)
        }
    }

    return true
}

export default {
    name: Events.InteractionCreate,
    handler
}
