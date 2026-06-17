import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { truncateString } from '@/internals/utility/Utils.js'
import {
    BaseGuildVoiceChannel,
    type CategoryChannelResolvable,
    ChannelType,
    type OverwriteData,
    OverwriteType,
    PermissionOverwrites,
    PermissionsBitField,
    VoiceChannel,
    VoiceState
} from 'discord.js'
import Replacer from './Replacer.js'

export async function createTemporaryVoice(self: Lacuna, server: ServerDocument, state: VoiceState) {
    const autoVoice = server.modules.voice_manager.autovoices.find(i => i.channel_id === state.channelId),
        autoVoiceIndex = server.modules.voice_manager.autovoices.findIndex(i => i.channel_id === state.channelId)

    if (autoVoiceIndex >= 2 && !server.premium.available) {
        await state.disconnect('TempVoices: No premium')

        return false
    }

    const hasPermissions = state.guild.members.me!.permissions.has(self.PermissionFlags.ManageChannels)

    if (autoVoice && hasPermissions) {
        const child = autoVoice.children?.find(c => c.owner_id === state.id)

        if (child) {
            const channel = state.guild.channels.cache.get(child.channel_id)

            if (channel && channel.manageable) {
                try {
                    await state.setChannel(child.channel_id, 'TempVoices: Move to an existing temporary voice channel')
                } catch (err) {
                    self.logger.error({
                        module: 'TempVoices',
                        action: 'SetChannelOnCreate',
                        err,
                        guildId: state.guild.id
                    })
                }
            }

            self.emit('moduleExecution', {
                guildId: state.guild.id,
                targetId: state.id,
                module: 'AutoVoice',
                category: 'MoveToTemporaryChannel'
            })

            return true
        }

        if (
            (autoVoice.allowed_roles?.length &&
                !state.member!.roles.cache.some(r => autoVoice.allowed_roles?.includes(r.id))) ||
            state.member!.roles.cache.some(r => autoVoice.blocked_roles?.includes(r.id))
        ) {
            await state.disconnect('TempVoices: Denied (has restrictions for some roles)')

            return false
        }

        const replacer = new Replacer(server.premium.available, {
            guild: state.guild,
            member: state.member!
        })

        let tempVoice: VoiceChannel,
            tempVoiceName = await replacer.replace(autoVoice.default.name || '#{index}: {member}', {
                index: (autoVoice.children?.length ?? 0) + 1
            }),
            tempVoicePermissionOverwrites: OverwriteData[] = [],
            tempVoiceParent = autoVoice.default.category_id
                ? state.guild.channels.cache
                      .filter(c => c.type === ChannelType.GuildCategory)
                      .get(autoVoice.default.category_id)
                : state.channel!.parent

        tempVoicePermissionOverwrites.push(...state.channel!.permissionOverwrites.cache.map(i => i.toJSON() as any))

        if (autoVoice.default.permissions) {
            const permissionsBitField = new PermissionsBitField(BigInt(autoVoice.default.permissions)),
                permissionOverwriteOptions = permissionsBitField.toArray().reduce((obj, k) => {
                    ;(obj as any)[k] = true
                    return obj
                }, {})
            const initialOwnerOverwrite = tempVoicePermissionOverwrites.find(i => i.id === state.id)
            const ownerOverwrite = PermissionOverwrites.resolveOverwriteOptions(
                permissionOverwriteOptions,
                initialOwnerOverwrite
                    ? ({ allow: initialOwnerOverwrite.allow, deny: initialOwnerOverwrite.deny } as any)
                    : {}
            )

            if (initialOwnerOverwrite) {
                const index = tempVoicePermissionOverwrites.findIndex(i => i.id === state.id)
                if (index !== -1) {
                    tempVoicePermissionOverwrites[index]!.allow = ownerOverwrite.allow
                    tempVoicePermissionOverwrites[index]!.deny = ownerOverwrite.deny
                }
            } else {
                tempVoicePermissionOverwrites.push({
                    id: state.id,
                    type: OverwriteType.Member,
                    allow: ownerOverwrite.allow,
                    deny: ownerOverwrite.deny
                })
            }

            if (autoVoice.moderator_roles?.length) {
                const modRoles = autoVoice.moderator_roles.filter(i =>
                    state.guild.roles.cache.some(ii => ii.id === i && ii.editable)
                )

                for (const modRole of modRoles) {
                    const initialRoleOverwrite = tempVoicePermissionOverwrites.find(i => i.id === modRole)
                    const roleOverwrite = PermissionOverwrites.resolveOverwriteOptions(
                        permissionOverwriteOptions,
                        initialRoleOverwrite
                            ? ({ allow: initialRoleOverwrite.allow, deny: initialRoleOverwrite.deny } as any)
                            : {}
                    )

                    if (initialRoleOverwrite) {
                        const index = tempVoicePermissionOverwrites.findIndex(i => i.id === modRole)
                        if (index !== -1) {
                            tempVoicePermissionOverwrites[index]!.allow = roleOverwrite.allow
                            tempVoicePermissionOverwrites[index]!.deny = roleOverwrite.deny
                        }
                    } else {
                        tempVoicePermissionOverwrites.push({
                            id: modRole,
                            type: OverwriteType.Role,
                            allow: roleOverwrite.allow,
                            deny: roleOverwrite.deny
                        })
                    }
                }
            }
        }

        try {
            tempVoice = await state.guild.channels.create({
                name: truncateString(tempVoiceName, 100),
                type: ChannelType.GuildVoice,
                permissionOverwrites: tempVoicePermissionOverwrites,
                parent:
                    tempVoiceParent && tempVoiceParent.manageable
                        ? (tempVoiceParent as CategoryChannelResolvable)
                        : null,
                userLimit: autoVoice.default.limit,
                bitrate: state.channel!.bitrate,
                position: (autoVoice.default.position === 'TOP' ? 0 : null) as any,
                reason: 'TempVoices: New temporary voice channel'
            })
        } catch (err) {
            self.logger.error({ module: 'TempVoices', action: 'CreateNewVoice', err, guildId: state.guild.id })

            return false
        }

        await self.db.servers.updateOne(
            { _id: state.guild.id, 'modules.voice_manager.autovoices.id': autoVoice.id },
            {
                $push: {
                    'modules.voice_manager.autovoices.$.children': {
                        channel_id: tempVoice.id,
                        owner_id: state.id,
                        created_at: Date.now()
                    }
                }
            }
        )

        const moveable: boolean = Boolean(
            state.channel!.permissionsFor(self.user!.id)?.has(self.PermissionFlags.MoveMembers)
        )

        if (moveable) {
            try {
                await state.setChannel(tempVoice.id, 'TempVoices: Move to the temporary voice channel')
            } catch (err) {
                self.logger.error({ module: 'TempVoices', action: 'MoveToNewVoice', err, guildId: state.guild.id })
            }
        }

        self.emit('moduleExecution', {
            guildId: state.guild.id,
            targetId: state.id,
            module: 'AutoVoice',
            category: 'CreateTemporaryChannel'
        })

        return true
    }

    return false
}

export async function createTemporaryVoiceOnMove(
    self: Lacuna,
    server: ServerDocument,
    before: VoiceState,
    state: VoiceState
) {
    const autoVoice = server.modules.voice_manager.autovoices.find(i => i.channel_id === state.channelId),
        beforeAutoVoice = server.modules.voice_manager.autovoices.find(i =>
            i.children?.some(c => c.channel_id === before.channelId)
        )
    const hasPermissions = state.guild.members.me!.permissions.has(self.PermissionFlags.ManageChannels)

    if (autoVoice && hasPermissions) {
        const child = autoVoice.children?.find(c => c.owner_id === state.id)

        if (child) {
            const channel = state.guild.channels.cache.get(child.channel_id)

            if (channel && channel.manageable) {
                try {
                    await state.setChannel(child.channel_id, 'TempVoices: Move to an existing temporary voice channel')
                } catch (err) {
                    self.logger.error({
                        module: 'TempVoices',
                        action: 'SetChannelOnMove',
                        err,
                        guildId: state.guild.id
                    })
                }
            }

            self.emit('moduleExecution', {
                guildId: state.guild.id,
                targetId: state.id,
                module: 'AutoVoice',
                category: 'MoveToTemporaryChannel'
            })

            return true
        }

        await createTemporaryVoice(self, server, state)
    }

    if (beforeAutoVoice && hasPermissions) {
        const child = beforeAutoVoice.children?.find(c => c.channel_id === before.channelId)!
        const channel = state.guild.channels.cache.get(child.channel_id) as BaseGuildVoiceChannel

        if (channel && state.channelId === beforeAutoVoice.channel_id && child?.owner_id === state.id) {
            if (channel.manageable) {
                try {
                    await state.setChannel(child.channel_id, 'TempVoices: Move to an existing temporary voice channel')
                } catch (err) {
                    self.logger.error({
                        module: 'TempVoices',
                        action: 'SetChannelOnMove',
                        err,
                        guildId: state.guild.id
                    })
                }
            }

            self.emit('moduleExecution', {
                guildId: state.guild.id,
                targetId: state.id,
                module: 'AutoVoice',
                category: 'MoveToTemporaryChannel'
            })

            return true
        }

        if (child && channel?.members?.size === 0) {
            await self.db.servers.updateOne(
                { _id: state.guild.id, 'modules.voice_manager.autovoices.id': beforeAutoVoice.id },
                {
                    $pull: {
                        'modules.voice_manager.autovoices.$.children': {
                            channel_id: child.channel_id
                        }
                    }
                }
            )

            if (channel.deletable) {
                await channel.delete('TempVoices: No members in the temporary voice channel')
            }

            self.emit('moduleExecution', {
                guildId: state.guild.id,
                targetId: state.id,
                module: 'AutoVoice',
                category: 'DeleteTemporaryChannel'
            })
        } else if (channel?.members?.size > 0 && state.id === child?.owner_id) {
            const childIndex = beforeAutoVoice.children?.indexOf(child)
            const newOwnerId = channel.members.first()!.id

            await self.db.servers.updateOne(
                { _id: state.guild.id, 'modules.voice_manager.autovoices.id': beforeAutoVoice.id },
                {
                    $set: {
                        [`modules.voice_manager.autovoices.$.children.${childIndex}.owner_id`]: newOwnerId
                    }
                }
            )
        }
    }

    return true
}

export async function deleteTemporaryVoice(
    self: Lacuna,
    server: ServerDocument,
    state: VoiceState,
    channel: VoiceChannel
) {
    const autoVoice = server.modules.voice_manager.autovoices.find(i =>
        i.children?.some(c => c.channel_id === channel?.id)
    )
    const hasPermissions = state.guild.members.me!.permissions.has(self.PermissionFlags.ManageChannels)

    if (autoVoice && hasPermissions) {
        const child = autoVoice.children?.find(c => c.channel_id === channel.id)

        if (child && channel?.members?.size === 0) {
            await self.db.servers.updateOne(
                { _id: channel.guild.id, 'modules.voice_manager.autovoices.id': autoVoice.id },
                {
                    $pull: {
                        'modules.voice_manager.autovoices.$.children': {
                            channel_id: child.channel_id
                        }
                    }
                }
            )

            if (channel.deletable) {
                await channel.delete('TempVoices: No members in the temporary voice channel')
            }

            self.emit('moduleExecution', {
                guildId: state.guild.id,
                targetId: state.id,
                module: 'AutoVoice',
                category: 'DeleteTemporaryChannel'
            })
        } else if (channel?.members?.size > 0 && state.id === child?.owner_id) {
            const childIndex = autoVoice.children?.indexOf(child)
            const newOwnerId = channel.members.first()!.id

            await self.db.servers.updateOne(
                { _id: channel.guild.id, 'modules.voice_manager.autovoices.id': autoVoice.id },
                {
                    $set: {
                        [`modules.voice_manager.autovoices.$.children.${childIndex}.owner_id`]: newOwnerId
                    }
                }
            )

            try {
                const ownerPermissionOverwrites = channel.permissionOverwrites.cache.get(child.owner_id)

                if (ownerPermissionOverwrites) {
                    await ownerPermissionOverwrites.delete(
                        'TempVoices: The original channel owner disconnected from temporary voice channel'
                    )
                }
            } catch (err) {
                self.logger.error({
                    module: 'TempVoices',
                    action: 'DeleteOwnerPermissions',
                    err,
                    guildId: state.guild.id
                })
            }

            const permissionsBitField = new PermissionsBitField(BigInt(autoVoice.default.permissions)),
                permissionOverwriteOptions = permissionsBitField.toArray().reduce((obj, k) => {
                    ;(obj as any)[k] = true
                    return obj
                }, {})

            try {
                const newOwnerPermissionOverwrites = channel.permissionOverwrites.cache.get(newOwnerId)

                if (newOwnerPermissionOverwrites) {
                    await newOwnerPermissionOverwrites.edit(
                        permissionOverwriteOptions,
                        'TempVoices: Set default permissions for the new channel owner'
                    )
                } else {
                    await channel.permissionOverwrites.create(newOwnerId, permissionOverwriteOptions, {
                        reason: 'TempVoices: Set default permissions for the new channel owner'
                    })
                }
            } catch (err) {
                self.logger.error({
                    module: 'TempVoices',
                    action: 'SetPermissionsForNewOwner',
                    err,
                    guildId: state.guild.id
                })
            }

            self.emit('moduleExecution', {
                guildId: state.guild.id,
                targetId: state.id,
                module: 'AutoVoice',
                category: 'SetNewChannelOwner'
            })
        }

        return true
    }

    return false
}

export default {
    createTemporaryVoice,
    createTemporaryVoiceOnMove,
    deleteTemporaryVoice
}
