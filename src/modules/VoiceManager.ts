import { BaseGuildVoiceChannel, CategoryChannelResolvable, ChannelType, PermissionsBitField, VoiceChannel, VoiceState } from 'discord.js'
import { ServerDocument } from '../database/schemas/Servers'
import Lacuna from '../internals/Lacuna'
import { truncateString } from '../internals/utility/Utils'
import Replacer from './Replacer'

export async function createTemporaryVoice(self: Lacuna, server: ServerDocument, state: VoiceState) {
    const autovoice = server.modules.voice_manager.autovoices.find(i => i.channel_id === state.channelId)
    const autovoiceIndex = server.modules.voice_manager.autovoices.indexOf(autovoice)

    if (autovoiceIndex >= 2 && !server.server.premium.available) {
        await state.disconnect('TempVoices: No premium')

        return false
    }

    if (autovoice && state.guild.members.me.permissions.has(self.PermissionFlags.ManageChannels)) {
        const child = autovoice.children?.find(c => c.owner_id === state.member.id)

        if (child) {
            const channel = state.guild.channels.cache.get(child.channel_id)

            if (channel && channel.manageable) {
                try {
                    await state.setChannel(child.channel_id, 'TempVoices: Move to an existing temporary voice channel')
                } catch (err) {
                    self.logger.handleError({ module: 'TempVoices', action: 'SetChannelOnCreate', error: err, guild_id: state.guild.id })
                }
            }

            self.emit('moduleExecution', {
                module: 'AutoVoice',
                category: 'MoveToTemporaryChannel',
                guild: { id: state.guild.id, name: state.guild.name },
                target: { id: state.member.id, name: state.member.user.tag }
            })

            return true
        }

        if (
            (autovoice.allowed_roles?.length && !state.member.roles.cache.some(r => autovoice.allowed_roles?.includes(r.id))) ||
            state.member.roles.cache.some(r => autovoice.blocked_roles?.includes(r.id))
        ) {
            await state.disconnect('TempVoices: Denied (has restrictions for some roles)')

            return false
        }

        const parent = autovoice.default.category_id
            ? state.guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).get(autovoice.default.category_id)
            : state.channel.parent
        const replacer = new Replacer(autovoice.default.name, {
            guild: state.guild,
            member: state.member,
            index: (autovoice.children?.length ?? 0) + 1
        })
        const name = await replacer.replace()
        const permissions = new PermissionsBitField(BigInt(autovoice.default.permissions))
        let tempVoice: VoiceChannel

        try {
            tempVoice = await state.guild.channels.create({
                name: truncateString(name, 100, '') || 'Voice',
                type: ChannelType.GuildVoice,
                permissionOverwrites: state.channel.permissionOverwrites.cache,
                parent: parent && parent.manageable ? (parent as CategoryChannelResolvable) : null,
                userLimit: autovoice.default.limit,
                bitrate: state.channel.bitrate,
                position: autovoice.default.position === 'TOP' ? 0 : null,
                reason: 'TempVoices: New temporary voice channel'
            })
        } catch (err) {
            self.logger.handleError({ module: 'TempVoices', action: 'CreateNewVoice', error: err, guild_id: state.guild.id })

            return false
        }

        if (autovoice.default.permissions) {
            try {
                await tempVoice.permissionOverwrites.create(
                    state.member.id,
                    permissions.toArray().reduce((obj, k) => {
                        obj[k] = true
                        return obj
                    }, {}),
                    { reason: 'TempVoices: Set default permissions for the channel owner' }
                )
            } catch (err) {
                self.logger.handleError({ module: 'TempVoices', action: 'SetPermissionsForOwner', error: err, guild_id: state.guild.id })
            }

            if (autovoice?.moderator_roles?.length) {
                const roles = autovoice.moderator_roles.filter(mr => state.guild.roles.cache.some(r => r.editable && r.id === mr))

                for (const role of roles) {
                    const overwrites = tempVoice.permissionOverwrites.cache.find(p => p.id === role)

                    try {
                        if (overwrites) {
                            await overwrites.edit(
                                permissions.toArray().reduce((obj, k) => {
                                    obj[k] = true
                                    return obj
                                }, {}),
                                'TempVoices: Set default permissions for moderator roles'
                            )
                        } else {
                            await tempVoice.permissionOverwrites.create(
                                role,
                                permissions.toArray().reduce((obj, k) => {
                                    obj[k] = true
                                    return obj
                                }, {}),
                                { reason: 'TempVoices: Set default permissions for moderator roles' }
                            )
                        }
                    } catch (err) {
                        self.logger.handleError({
                            module: 'TempVoices',
                            action: 'SetPermissionsForModeratorRoles',
                            error: err,
                            guild_id: state.guild.id
                        })
                    }
                }
            }
        }

        await self.db.servers.updateOne(
            { _id: state.guild.id, 'modules.voice_manager.autovoices.id': autovoice.id },
            {
                $push: {
                    'modules.voice_manager.autovoices.$.children': {
                        channel_id: tempVoice.id,
                        owner_id: state.member.id,
                        created_at: Date.now()
                    }
                }
            }
        )

        const moveable: boolean = state.channel.permissionsFor(self.user.id).has(self.PermissionFlags.MoveMembers)

        if (moveable) {
            try {
                await state.setChannel(tempVoice.id, 'TempVoices: Move to the temporary voice channel')
            } catch (err) {
                self.logger.handleError({ module: 'TempVoices', action: 'MoveToNewVoice', error: err, guild_id: state.guild.id })
            }
        }

        self.emit('moduleExecution', {
            module: 'AutoVoice',
            category: 'CreateTemporaryChannel',
            guild: { id: state.guild.id, name: state.guild.name },
            target: { id: state.member.id, name: state.member.user.tag }
        })

        return true
    }

    return false
}

export async function createTemporaryVoiceOnMove(self: Lacuna, server: ServerDocument, before: VoiceState, state: VoiceState) {
    const autovoice = server.modules.voice_manager.autovoices.find(i => i.channel_id === state.channelId)
    const beforeAutovoice = server.modules.voice_manager.autovoices.find(i => i.children?.some(c => c.channel_id === before.channelId))

    if (autovoice && state.guild.members.me.permissions.has(self.PermissionFlags.ManageChannels)) {
        const child = autovoice.children?.find(c => c.owner_id === state.member.id)

        if (child) {
            const channel = state.guild.channels.cache.get(child.channel_id)

            if (channel && channel.manageable) {
                try {
                    await state.setChannel(child.channel_id, 'TempVoices: Move to an existing temporary voice channel')
                } catch (err) {
                    self.logger.handleError({ module: 'TempVoices', action: 'SetChannelOnMove', error: err, guild_id: state.guild.id })
                }
            }

            self.emit('moduleExecution', {
                module: 'AutoVoice',
                category: 'MoveToTemporaryChannel',
                guild: { id: state.guild.id, name: state.guild.name },
                target: { id: state.member.id, name: state.member.user.tag }
            })

            return true
        }

        await createTemporaryVoice(self, server, state)
    }

    if (beforeAutovoice && state.guild.members.me.permissions.has(self.PermissionFlags.ManageChannels)) {
        const child = beforeAutovoice.children?.find(c => c.channel_id === before.channelId)
        const channel = state.guild.channels.cache.get(child.channel_id) as BaseGuildVoiceChannel

        if (channel && state.channelId === beforeAutovoice.channel_id && child.owner_id === state.member.id) {
            if (channel.manageable) {
                try {
                    await state.setChannel(child.channel_id, 'TempVoices: Move to an existing temporary voice channel')
                } catch (err) {
                    self.logger.handleError({ module: 'TempVoices', action: 'SetChannelOnMove', error: err, guild_id: state.guild.id })
                }
            }

            self.emit('moduleExecution', {
                module: 'AutoVoice',
                category: 'MoveToTemporaryChannel',
                guild: { id: state.guild.id, name: state.guild.name },
                target: { id: state.member.id, name: state.member.user.tag }
            })

            return true
        }

        if (child && channel && !channel.members.size) {
            await self.db.servers.updateOne(
                { _id: state.guild.id, 'modules.voice_manager.autovoices.id': beforeAutovoice.id },
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
                module: 'AutoVoice',
                category: 'DeleteTemporaryChannel',
                guild: { id: channel.guild.id, name: channel.guild.name },
                target: { id: channel.id, name: channel.name }
            })
        } else if (child && channel && channel.members.size) {
            const childIndex = beforeAutovoice.children?.indexOf(child)
            const newOwnerId = channel.members.first().id

            await self.db.servers.updateOne(
                { _id: state.guild.id, 'modules.voice_manager.autovoices.id': beforeAutovoice.id },
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

export async function deleteTemporaryVoice(self: Lacuna, server: ServerDocument, state: VoiceState, channel: VoiceChannel) {
    const autovoice = server.modules.voice_manager.autovoices.find(i => i.children?.some(c => c.channel_id === channel?.id))

    if (autovoice && channel.guild.members.me.permissions.has(self.PermissionFlags.ManageChannels)) {
        const child = autovoice.children?.find(c => c.channel_id === channel.id)

        if (!child) return false

        if (!channel.members.size) {
            await self.db.servers.updateOne(
                { _id: channel.guild.id, 'modules.voice_manager.autovoices.id': autovoice.id },
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
                module: 'AutoVoice',
                category: 'DeleteTemporaryChannel',
                guild: { id: channel.guild.id, name: channel.guild.name },
                target: { id: channel.id, name: channel.name }
            })
        } else if (channel.members.size && state.member.id === child.owner_id) {
            const childIndex: number = autovoice.children?.indexOf(child)
            const newOwnerId = channel.members.first().id

            await self.db.servers.updateOne(
                { _id: channel.guild.id, 'modules.voice_manager.autovoices.id': autovoice.id },
                {
                    $set: {
                        [`modules.voice_manager.autovoices.$.children.${childIndex}.owner_id`]: newOwnerId
                    }
                }
            )

            const overwrites = channel.permissionOverwrites.cache.find(p => p.id === child.owner_id)

            if (overwrites) {
                try {
                    await overwrites.delete('TempVoices: The original channel owner disconnected from temporary voice channel')
                } catch (err) {
                    self.logger.handleError({ module: 'TempVoices', action: 'DeleteOwnerPermissions', error: err, guild_id: state.guild.id })
                }
            }

            const permissions = new PermissionsBitField(BigInt(autovoice.default.permissions))

            try {
                await channel.permissionOverwrites.create(
                    newOwnerId,
                    permissions.toArray().reduce((obj, k) => {
                        obj[k] = true
                        return obj
                    }, {}),
                    { reason: 'TempVoices: Set default permissions for the new channel owner' }
                )
            } catch (err) {
                self.logger.handleError({ module: 'TempVoices', action: 'SetPermissionsForNewOwner', error: err, guild_id: state.guild.id })
            }

            self.emit('moduleExecution', {
                module: 'AutoVoice',
                category: 'SetNewChannelOwner',
                guild: { id: channel.guild.id, name: channel.guild.name },
                target: { id: channel.id, name: channel.name }
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
