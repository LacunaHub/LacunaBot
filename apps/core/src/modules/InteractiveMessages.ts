import {
    type ServerDocument,
    type ServerModulesInteractiveMessageButtonComponent,
    type ServerModulesInteractiveMessageSelectMenuComponent
} from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { snakeToPascalCase } from '@/internals/utility/Utils.js'
import {
    type AnySelectMenuInteraction,
    ButtonInteraction,
    Collection,
    GuildChannel,
    GuildMember,
    MessageReaction,
    User
} from 'discord.js'
import Replacer from './Replacer.js'

async function handleButtonClick(self: Lacuna, server: ServerDocument, interaction: ButtonInteraction<'cached'>) {
    const interactiveMessage = server.modules.interactive_messages
        .slice(0, 50)
        .find(i => i.id === interaction.message.id)

    if (interactiveMessage && interaction.member instanceof GuildMember) {
        await interaction.deferUpdate()

        const buttons = interactiveMessage.components.flat().filter(i => i.type === 'BUTTON')
        const button = buttons.find(
            i => i.id === interaction.customId
        ) as ServerModulesInteractiveMessageButtonComponent

        if (button.options.includes('RESTRICT_ROLES') && Array.isArray(button.restricted_roles)) {
            if (interaction.member.roles.cache.some(i => button.restricted_roles!.includes(i.id))) return false
        }

        if (button?.options?.includes('EPHEMERAL_REPLY') && button?.ephemeral_reply) {
            const replacer = new Replacer({
                    guild: interaction.guild,
                    member: interaction.member
                }),
                messagePayload = await replacer.replaceTemplateMessage(button.ephemeral_reply)

            try {
                await interaction.followUp({ ...messagePayload, ephemeral: true })
            } catch (err) {
                self.logger.error({
                    module: 'InteractiveMessages',
                    action: 'ButtonEphemeralReply',
                    err,
                    guildId: interaction.guildId
                })
            }
        }

        if (button?.options?.includes('MODIFY_ROLES') && button?.modify_roles) {
            const addRoles = interaction.guild.roles.cache
                .filter(i => i.editable && button.modify_roles!.add.includes(i.id))
                .first(8)
            const removeRoles = interaction.guild.roles.cache
                .filter(i => i.editable && button.modify_roles!.remove.includes(i.id))
                .first(8)

            if (addRoles.length) {
                const hasRoles =
                    button.modify_roles.reversible_add &&
                    interaction.member.roles.cache.hasAny(...addRoles.map(i => i.id))

                try {
                    if (hasRoles) {
                        await interaction.member.roles.remove(addRoles, 'Interactive messages: Modify roles')
                    } else {
                        await interaction.member.roles.add(addRoles, 'Interactive messages: Modify roles')
                    }
                } catch (err) {
                    self.logger.error({
                        module: 'InteractiveMessages',
                        action: 'ButtonModifyRolesAdd',
                        err,
                        guildId: interaction.guildId
                    })
                }
            }

            if (removeRoles.length) {
                const missingRoles =
                    button.modify_roles.reversible_remove &&
                    !interaction.member.roles.cache.hasAll(...removeRoles.map(i => i.id))

                try {
                    if (missingRoles) {
                        await interaction.member.roles.add(removeRoles, 'Interactive messages: Modify roles')
                    } else {
                        await interaction.member.roles.remove(removeRoles, 'Interactive messages: Modify roles')
                    }
                } catch (err) {
                    self.logger.error({
                        module: 'InteractiveMessages',
                        action: 'ButtonModifyRolesRemove',
                        err,
                        guildId: interaction.guildId
                    })
                }
            }
        }

        if (button?.options?.includes('OVERWRITE_CHANNEL_PERMISSIONS') && button?.overwrite_channel_permissions) {
            const channels = interaction.guild.channels.cache.filter(
                i => i.manageable && button.overwrite_channel_permissions!.channels.includes(i.id)
            ) as Collection<string, GuildChannel>

            for (const channel of channels.first(8)) {
                const overwrites = channel.permissionOverwrites.cache.get(interaction.user.id)

                try {
                    if (overwrites && button.overwrite_channel_permissions.reversible) {
                        await overwrites.delete('Interactive messages: Overwrite channel permissions')
                    } else {
                        const overwriteOptions = Object.keys(button.overwrite_channel_permissions.permissions).reduce(
                            (obj, k) => {
                                ;(obj as any)[snakeToPascalCase(k)] =
                                    button.overwrite_channel_permissions!.permissions[k]
                                return obj
                            },
                            {}
                        )

                        await channel.permissionOverwrites.create(interaction.user.id, overwriteOptions, {
                            reason: 'Interactive messages: Overwrite channel permissions'
                        })
                    }
                } catch (err) {
                    self.logger.error({
                        module: 'InteractiveMessages',
                        action: 'OverwriteChannelPermissions',
                        err,
                        guildId: interaction.guildId
                    })
                }
            }
        }

        self.emit('moduleExecution', {
            guildId: interaction.guildId,
            targetId: interaction.member.id,
            module: 'InteractiveMessages',
            category: 'Button'
        })
    }
}

async function handleSelectMenuSelection(self: Lacuna, server: ServerDocument, interaction: AnySelectMenuInteraction) {
    const interactiveMessage = server.modules.interactive_messages
        .slice(0, 50)
        .find(i => i.id === interaction.message.id)

    if (interactiveMessage && interaction.member instanceof GuildMember) {
        await interaction.deferUpdate()

        const selects = interactiveMessage.components.flat().filter(i => i.type === 'SELECT_MENU')
        const select = selects.find(
            i => i.id === interaction.customId
        ) as ServerModulesInteractiveMessageSelectMenuComponent
        const value = interaction.values[0]

        const option = select?._options?.find(i => i.appearance.value === value)

        if (option?.options?.includes('RESTRICT_ROLES') && Array.isArray(option.restricted_roles)) {
            if (interaction.member.roles.cache.some(i => option.restricted_roles!.includes(i.id))) return false
        }

        if (option?.options?.includes('EPHEMERAL_REPLY') && option.ephemeral_reply) {
            const replacer = new Replacer({
                    guild: interaction.guild!,
                    member: interaction.member
                }),
                messagePayload = await replacer.replaceTemplateMessage(option.ephemeral_reply)

            try {
                await interaction.followUp({ ...messagePayload, ephemeral: true })
            } catch (err) {
                self.logger.error({
                    module: 'InteractiveMessages',
                    action: 'SelectMenuEphemeralReply',
                    err,
                    guildId: interaction.guildId
                })
            }
        }

        if (option?.options?.includes('MODIFY_ROLES') && option.modify_roles) {
            const addRoles = interaction
                .guild!.roles.cache.filter(i => i.editable && option.modify_roles!.add.includes(i.id))
                .first(8)
            const removeRoles = interaction
                .guild!.roles.cache.filter(i => i.editable && option.modify_roles!.remove.includes(i.id))
                .first(8)

            if (addRoles.length) {
                const hasRoles =
                    option.modify_roles.reversible_add &&
                    interaction.member.roles.cache.hasAny(...addRoles.map(i => i.id))

                try {
                    if (hasRoles) {
                        await interaction.member.roles.remove(addRoles, 'Interactive messages: Modify roles')
                    } else {
                        await interaction.member.roles.add(addRoles, 'Interactive messages: Modify roles')
                    }
                } catch (err) {
                    self.logger.error({
                        module: 'InteractiveMessages',
                        action: 'SelectMenuModifyRolesAdd',
                        err,
                        guildId: interaction.guildId
                    })
                }
            }

            if (removeRoles.length) {
                const missingRoles =
                    option.modify_roles.reversible_remove &&
                    !interaction.member.roles.cache.hasAll(...removeRoles.map(i => i.id))

                try {
                    if (missingRoles) {
                        await interaction.member.roles.add(removeRoles, 'Interactive messages: Modify roles')
                    } else {
                        await interaction.member.roles.remove(removeRoles, 'Interactive messages: Modify roles')
                    }
                } catch (err) {
                    self.logger.error({
                        module: 'InteractiveMessages',
                        action: 'SelectMenuModifyRolesRemove',
                        err,
                        guildId: interaction.guildId
                    })
                }
            }
        }

        if (option?.options?.includes('OVERWRITE_CHANNEL_PERMISSIONS') && option.overwrite_channel_permissions) {
            const channels = interaction.guild!.channels.cache.filter(
                i => i.manageable && option.overwrite_channel_permissions!.channels.includes(i.id)
            ) as Collection<string, GuildChannel>

            for (const channel of channels.first(8)) {
                const overwrites = channel.permissionOverwrites.cache.get(interaction.user.id)

                try {
                    if (overwrites && option.overwrite_channel_permissions.reversible) {
                        await overwrites.delete('Interactive messages: Overwrite channel permissions')
                    } else {
                        const overwriteOptions = Object.keys(option.overwrite_channel_permissions.permissions).reduce(
                            (obj, k) => {
                                ;(obj as any)[snakeToPascalCase(k)] =
                                    option.overwrite_channel_permissions!.permissions[k]
                                return obj
                            },
                            {}
                        )

                        await channel.permissionOverwrites.create(interaction.user.id, overwriteOptions, {
                            reason: 'Interactive messages: Overwrite channel permissions'
                        })
                    }
                } catch (err) {
                    self.logger.error({
                        module: 'InteractiveMessages',
                        action: 'SelectMenuOverwriteChannelPermissions',
                        err,
                        guildId: interaction.guildId
                    })
                }
            }
        }

        self.emit('moduleExecution', {
            guildId: interaction.guildId,
            targetId: interaction.member.id,
            module: 'InteractiveMessages',
            category: 'SelectMenu'
        })
    }
}

async function handleReactionAdd(self: Lacuna, server: ServerDocument, reaction: MessageReaction, user: User) {
    const message = reaction.message
    const interactiveMessage = server.modules.interactive_messages.slice(0, 50).find(i => i.id === message.id)

    if (interactiveMessage) {
        const member = await message.guild!.members.fetch(user.id)
        const imReaction = interactiveMessage.reactions
            .slice(0, 10)
            .find(i => (i.emoji.id ? i.emoji.id == reaction.emoji.id : i.emoji.name === reaction.emoji.name))

        if (imReaction?.options?.includes('RESTRICT_ROLES') && Array.isArray(imReaction.restricted_roles)) {
            if (member.roles.cache.some(i => imReaction.restricted_roles!.includes(i.id))) {
                await reaction.users.remove(user)

                return false
            }
        }

        if (imReaction?.options?.includes('MODIFY_ROLES') && imReaction.modify_roles) {
            const addRoles = message
                .guild!.roles.cache.filter(i => i.editable && imReaction.modify_roles!.add.includes(i.id))
                .first(8)
            const removeRoles = message
                .guild!.roles.cache.filter(i => i.editable && imReaction.modify_roles!.remove.includes(i.id))
                .first(8)

            try {
                if (addRoles.length) {
                    await member.roles.add(addRoles, 'Interactive messages: Modify roles')
                }

                if (removeRoles.length) {
                    await member.roles.remove(removeRoles, 'Interactive messages: Modify roles')
                }
            } catch (err) {
                self.logger.error({
                    module: 'InteractiveMessages',
                    action: 'ReactionAddModifyRoles',
                    err,
                    guildId: message.guildId
                })
            }
        }

        if (
            imReaction?.options?.includes('OVERWRITE_CHANNEL_PERMISSIONS') &&
            imReaction?.overwrite_channel_permissions
        ) {
            const channels = message.guild!.channels.cache.filter(
                i => i.manageable && imReaction.overwrite_channel_permissions!.channels.includes(i.id)
            ) as Collection<string, GuildChannel>

            for (const channel of channels.first(8)) {
                const overwrites = channel.permissionOverwrites.cache.get(user.id)

                if (!overwrites) {
                    const overwriteOptions = Object.keys(imReaction.overwrite_channel_permissions.permissions).reduce(
                        (obj, k) => {
                            ;(obj as any)[snakeToPascalCase(k)] =
                                imReaction.overwrite_channel_permissions!.permissions[k]
                            return obj
                        },
                        {}
                    )

                    try {
                        await channel.permissionOverwrites.create(user.id, overwriteOptions, {
                            reason: 'Interactive messages: Overwrite channel permissions'
                        })
                    } catch (err) {
                        self.logger.error({
                            module: 'InteractiveMessages',
                            action: 'ReactionAddOverwriteChannelPermissions',
                            err,
                            guildId: message.guildId
                        })
                    }
                }
            }
        }

        self.emit('moduleExecution', {
            guildId: message.guildId,
            targetId: user.id,
            module: 'InteractiveMessages',
            category: 'ReactionAdd'
        })
    }
}

async function handleReactionRemove(self: Lacuna, server: ServerDocument, reaction: MessageReaction, user: User) {
    const message = reaction.message
    const interactiveMessage = server.modules.interactive_messages.slice(0, 50).find(i => i.id === message.id)

    if (interactiveMessage) {
        const member = await message.guild!.members.fetch(user.id)
        const imReaction = interactiveMessage.reactions
            .slice(0, 10)
            .find(i => (i.emoji.id ? i.emoji.id == reaction.emoji.id : i.emoji.name === reaction.emoji.name))

        if (imReaction?.options?.includes('MODIFY_ROLES') && imReaction.modify_roles) {
            const addRoles = message
                .guild!.roles.cache.filter(i => i.editable && imReaction.modify_roles!.add.includes(i.id))
                .first(8)
            const removeRoles = message
                .guild!.roles.cache.filter(i => i.editable && imReaction.modify_roles!.remove.includes(i.id))
                .first(8)

            if (addRoles.length) {
                const hasRoles =
                    imReaction.modify_roles.reversible_add && member.roles.cache.hasAny(...addRoles.map(i => i.id))

                if (hasRoles) {
                    try {
                        await member.roles.remove(addRoles, 'Interactive messages: Modify roles')
                    } catch (err) {
                        self.logger.error({
                            module: 'InteractiveMessages',
                            action: 'ReactionRemoveModifyRoles',
                            err,
                            guildId: message.guildId
                        })
                    }
                }
            }

            if (removeRoles.length) {
                const missingRoles =
                    imReaction.modify_roles.reversible_remove &&
                    !member.roles.cache.hasAll(...removeRoles.map(i => i.id))

                if (missingRoles) {
                    try {
                        await member.roles.add(removeRoles, 'Interactive messages: Modify roles')
                    } catch (err) {
                        self.logger.error({
                            module: 'InteractiveMessages',
                            action: 'ReactionRemoveModifyRoles',
                            err,
                            guildId: message.guildId
                        })
                    }
                }
            }
        }

        if (
            imReaction?.options?.includes('OVERWRITE_CHANNEL_PERMISSIONS') &&
            imReaction?.overwrite_channel_permissions
        ) {
            const channels = message.guild!.channels.cache.filter(
                i => i.manageable && imReaction.overwrite_channel_permissions!.channels.includes(i.id)
            ) as Collection<string, GuildChannel>

            for (const channel of channels.first(8)) {
                const overwrites = channel.permissionOverwrites.cache.get(user.id)

                if (overwrites && imReaction.overwrite_channel_permissions.reversible) {
                    try {
                        await overwrites.delete('Interactive messages: Overwrite channel permissions')
                    } catch (err) {
                        self.logger.error({
                            module: 'InteractiveMessages',
                            action: 'ReactionRemoveOverwriteChannelPermissions',
                            err,
                            guildId: message.guildId
                        })
                    }
                }
            }
        }

        self.emit('moduleExecution', {
            guildId: message.guildId,
            targetId: user.id,
            module: 'InteractiveMessages',
            category: 'ReactionRemove'
        })
    }
}

export default {
    handleButtonClick,
    handleSelectMenuSelection,
    handleReactionAdd,
    handleReactionRemove
}
