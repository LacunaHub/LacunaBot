import { ButtonInteraction, Collection, CommandInteraction, ContextMenuInteraction, GuildChannel, Message } from 'discord.js'
import { InteractiveMessageButtonComponent, InteractiveMessageSelectMenuComponent, ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { buttonPressed } from '../../internals/structures/Giveaway'
import { resolveObjectPath } from '../../internals/utility/Utils'
import CustomCommand from '../../modules/CustomCommand'
import Replacer from '../../modules/Replacer'
import reports from '../../modules/Reports'

const handler = async (self: Lacuna, interaction: CommandInteraction | ContextMenuInteraction | ButtonInteraction) => {
    if (!interaction.inGuild() || interaction.inRawGuild()) return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: interaction.guildId })
    interaction.member = await interaction.guild.members.fetch(interaction.user.id)

    if (interaction.isCommand()) {
        const command = self.commands.find(c => c.is_slash_command && c.name == interaction.commandName)
        const customCommand = server.modules.custom_commands.find(i => i.id === interaction.commandId)

        if (command) await command.executeSlash(server, interaction)
        if (!command && customCommand) {
            const custom = new CustomCommand(customCommand, self, server, interaction)

            await custom.execute()
        }
    }

    if (interaction.isContextMenu()) {
        const locale = self.translator.locale(server.locale)

        const command = self.commands.find(c => (c.is_message_command || c.is_user_command) && resolveObjectPath(c.pretty_name, locale) == interaction.commandName)

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

            if (message?.id == interaction.message?.id) {
                if (interaction.member.voice.channel?.id != player.voiceChannel) {
                    interaction.reply({
                        content: `${self._emojis.ERROR} | ${self.i18n.t(server.locale, 'commands.next.text_different_voice', {
                            user: `**${interaction.member.displayName}**`
                        })}`,
                        ephemeral: true
                    })

                    return false
                }

                const rows = message.components

                if (interaction.customId == rows[0].components[0].customId) {
                    player.destroy()
                }

                if (interaction.customId == rows[0].components[1].customId) {
                    if (player.queue.previous && player.position < 5000) {
                        await player.play(player.queue.previous)
                        player.queue.add(player.queue.current, 0)
                    } else if (player.queue.current.isSeekable) player.seek(0)
                }

                if (interaction.customId == rows[0].components[2].customId) {
                    player.pause(!player.paused)
                    ;(rows[0].components[2] as any).setEmoji(player.paused ? '▶️' : '⏸️')
                }

                if (interaction.customId == rows[0].components[3].customId) {
                    if (player.queueRepeat) player.queue.add(player.queue.current)
                    player.stop()
                }

                if (interaction.customId == rows[0].components[4].customId) {
                    if (!player.trackRepeat && !player.queueRepeat) {
                        ;(rows[0].components[4] as any).setEmoji('🔂')
                        player.setQueueRepeat(true)
                    } else if (player.queueRepeat) {
                        ;(rows[0].components[4] as any).setEmoji('➡️')
                        player.setTrackRepeat(true)
                    } else {
                        ;(rows[0].components[4] as any).setEmoji('🔁')
                        player.setTrackRepeat(false)
                    }
                }

                if (interaction.customId == rows[1].components[0].customId) {
                    self.commands.get('queue').executeSlash(server, interaction as any)
                }

                if (interaction.customId != rows[0].components[0].customId) await message.edit({ components: rows })
                if (interaction.customId != rows[1].components[0].customId) await interaction.deferUpdate()
            }

            return true
        }

        const im = server.modules.interactive_messages.slice(0, server.server.premium.available ? 50 : 5).find(i => i.id == interaction.message.id)

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
                    const missingRoles = button.modify_roles.reversible_remove && !interaction.member.roles.cache.hasAll(...removeRoles.map(i => i.id))

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
                        await channel.permissionOverwrites.create(interaction.user.id, button.overwrite_channel_permissions.permissions).catch(() => {})
                    }
                }
            }
        }
    }

    if (interaction.isSelectMenu()) {
        if (/R\-\w+\-\d+/.test(interaction.customId)) {
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
                    const missingRoles = option.modify_roles.reversible_remove && !interaction.member.roles.cache.hasAll(...removeRoles.map(i => i.id))

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
                        await channel.permissionOverwrites.create(interaction.user.id, option.overwrite_channel_permissions.permissions).catch(() => {})
                    }
                }
            }
        }
    }

    return true
}

export default {
    name: 'interactionCreate',
    handler
}
