import { BaseGuildVoiceChannel, CategoryChannelResolvable, Permissions, VoiceChannel, VoiceState } from 'discord.js'
import { ServerDocument } from '../database/schemas/Servers'
import Lacuna from '../internals/Lacuna'
import { truncateString } from '../internals/utility/Utils'
import Replacer from './Replacer'

export async function createTemporaryVoice(self: Lacuna, server: ServerDocument, state: VoiceState) {
    const autovoice = server.modules.voice_manager.autovoices.find(i => i.channel_id == state.channelId)
    const autovoiceIndex = server.modules.voice_manager.autovoices.indexOf(autovoice)

    if (autovoiceIndex >= 2 && !server.server.premium.available) {
        await state.disconnect()

        return false
    }

    if (autovoice && state.guild.me.permissions.has(self.PERMISSIONS_FLAGS.MANAGE_CHANNELS)) {
        const child = autovoice.children.find(c => c.owner_id == state.member.id)

        if (child) {
            const channel = state.guild.channels.cache.get(child.channel_id)

            if (channel && channel.manageable) await state.member.voice.setChannel(child.channel_id)

            self.emit('moduleExecution', { module: 'Temp Voice: Move', guild: { id: state.guild.id, name: state.guild.name }, target: { id: state.member.id, name: state.member.user.tag } })

            return true
        }

        if ((autovoice.allowed_roles?.length && !state.member.roles.cache.some(r => autovoice.allowed_roles?.includes(r.id))) || state.member.roles.cache.some(r => autovoice.blocked_roles?.includes(r.id))) {
            await state.disconnect()

            return false
        }

        const parent = autovoice.default.category_id ? state.guild.channels.cache.filter(c => c.type == 'GUILD_CATEGORY').get(autovoice.default.category_id) : state.channel.parent
        const replacer = new Replacer(autovoice.default.name, { guild: state.guild, member: state.member, index: autovoice.children.length + 1 })
        const name = await replacer.replace()
        const permissions = new Permissions(BigInt(autovoice.default.permissions))
        
        const temp_voice = await state.guild.channels.create(truncateString(name, 100, '') || 'Voice', {
            type: 'GUILD_VOICE',
            permissionOverwrites: state.channel.permissionOverwrites.cache,
            parent: parent && parent.manageable ? parent as CategoryChannelResolvable : null,
            userLimit: autovoice.default.limit,
            bitrate: state.channel.bitrate
        })

        if (autovoice.default.permissions) {
            await temp_voice.permissionOverwrites.create(state.member.id, permissions.toArray().reduce((obj, k) => { obj[k] = true; return obj }, {}))

            if (autovoice?.moderator_roles?.length) {
                const roles = autovoice.moderator_roles.filter(mr => state.guild.roles.cache.some(r => r.editable && r.id == mr))

                for (const role of roles) {
                    const overwrites = temp_voice.permissionOverwrites.cache.find(p => p.id == role)

                    if (overwrites) await overwrites.edit(permissions.toArray().reduce((obj, k) => { obj[k] = true; return obj }, {}))
                    else await temp_voice.permissionOverwrites.create(role, permissions.toArray().reduce((obj, k) => { obj[k] = true; return obj }, {}))
                }
            }
        }

        if (autovoice.default.position == 'TOP') await temp_voice.setPosition(0)

        await self.db.servers.updateOne({ _id: state.guild.id, 'modules.voice_manager.autovoices.id': autovoice.id }, {
            $push: {
                'modules.voice_manager.autovoices.$.children': {
                    channel_id: temp_voice.id,
                    owner_id: state.member.id,
                    created_at: Date.now()
                }
            }
        })

        const moveable: boolean = state.channel.permissionsFor(self.user.id).has(self.PERMISSIONS_FLAGS.MOVE_MEMBERS)

        if (moveable) await state.setChannel(temp_voice.id)

        self.emit('moduleExecution', { module: 'Temp Voice: Create', guild: { id: state.guild.id, name: state.guild.name }, target: { id: state.member.id, name: state.member.user.tag } })
    
        return true
    }

    return false
}

export async function createTemporaryVoiceOnMove(self: Lacuna, server: ServerDocument, before: VoiceState, state: VoiceState) {
    const autovoice = server.modules.voice_manager.autovoices.find(i => i.channel_id == state.channelId)
    const beforeAutovoice = server.modules.voice_manager.autovoices.find(i => i.children.some(c => c.channel_id == before.channelId))

    if (autovoice && state.guild.me.permissions.has('MANAGE_CHANNELS')) {
        const child = autovoice.children.find(c => c.owner_id == state.member.id)

        if (child) {
            const channel = state.guild.channels.cache.get(child.channel_id)

            if (channel && channel.manageable) await state.setChannel(child.channel_id)

            self.emit('moduleExecution', { module: 'Temp Voice: Move', guild: { id: state.guild.id, name: state.guild.name }, target: { id: state.member.id, name: state.member.user.tag } })

            return true
        }

        await createTemporaryVoice(self, server, state)
    
        return true
    }

    if (beforeAutovoice && state.guild.me.permissions.has('MANAGE_CHANNELS')) {
        const child = beforeAutovoice.children.find(c => c.channel_id == before.channelId)
        const channel = state.guild.channels.cache.get(child.channel_id) as BaseGuildVoiceChannel

        if (channel && state.channelId == beforeAutovoice.channel_id && child.owner_id == state.member.id) {
            if (channel.manageable) await state.setChannel(child.channel_id, '')

            self.emit('moduleExecution', { module: 'Temp Voice: Move', guild: { id: state.guild.id, name: state.guild.name }, target: { id: state.member.id, name: state.member.user.tag } })

            return true
        }

        if (child && channel && !channel.members.size) {
            await self.db.servers.updateOne({ _id: state.guild.id, 'modules.voice_manager.autovoices.id': beforeAutovoice.id }, {
                $pull: {
                    'modules.voice_manager.autovoices.$.children': {
                        channel_id: child.channel_id
                    }
                }
            })

            if (channel.deletable) await channel.delete()

            self.emit('moduleExecution', { module: 'Temp Voice: Delete', guild: { id: channel.guild.id, name: channel.guild.name }, target: { id: channel.id, name: channel.name } })
        }

        else if (child && channel && channel.members.size) {
            const children_index = beforeAutovoice.children.indexOf(child)

            await self.db.servers.updateOne({ _id: state.guild.id, 'modules.voice_manager.autovoices.id': beforeAutovoice.id }, {
                $set: {
                    [`modules.voice_manager.autovoices.$.children.${children_index}.owner_id`]: channel.members.first().id
                }
            })
        }

        return true
    }

    return false
}

export async function deleteTemporaryVoice(self: Lacuna, server: ServerDocument, channel: VoiceChannel) {
    const autovoice = server.modules.voice_manager.autovoices.find(i => i.children.some(c => c.channel_id == channel?.id))

    if (autovoice && channel.guild.me.permissions.has('MANAGE_CHANNELS')) {
        const child = autovoice.children.find(c => c.channel_id == channel.id)

        if (child && !channel.members.size) {
            await self.db.servers.updateOne({ _id: channel.guild.id, 'modules.voice_manager.autovoices.id': autovoice.id }, {
                $pull: {
                    'modules.voice_manager.autovoices.$.children': {
                        channel_id: child.channel_id
                    }
                }
            })

            if (channel.deletable) await channel.delete()

            self.emit('moduleExecution', { module: 'Temp Voice: Delete', guild: { id: channel.guild.id, name: channel.guild.name }, target: { id: channel.id, name: channel.name } })
        }

        else if (child && channel.members.size) {
            const childIndex: number = autovoice.children.indexOf(child)

            await self.db.servers.updateOne({ _id: channel.guild.id, 'modules.voice_manager.autovoices.id': autovoice.id }, {
                $set: {
                    [`modules.voice_manager.autovoices.$.children.${childIndex}.owner_id`]: channel.members.first().id
                }
            })

            const overwrites = channel.permissionOverwrites.cache.find(p => p.id === child.owner_id)
            if (overwrites) await overwrites.delete()

            const permissions = new Permissions(BigInt(autovoice.default.permissions))
            await channel.permissionOverwrites.create(channel.members.first().id, permissions.toArray().reduce((obj, k) => { obj[k] = true; return obj }, {}))
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