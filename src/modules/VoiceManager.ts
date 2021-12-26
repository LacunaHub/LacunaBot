import { BaseGuildVoiceChannel, CategoryChannelResolvable, Permissions, VoiceChannel, VoiceState } from 'discord.js'
import { ServerDocument, VoiceChannelTrigger, VoiceChannelTriggerChildren } from '../database/schemas/Servers'
import Lacuna from '../internals/Lacuna'
import { truncateString } from '../internals/utility/Utils'
import Replacer from './Replacer'

export async function createTemporaryVoice(self: Lacuna, server: ServerDocument, state: VoiceState) {
    const trigger: VoiceChannelTrigger = server.modules.voice_manager.temp_voice_channels.triggers.find(t => t.channel_id == state.channelId)
    const trigger_index: number = server.modules.voice_manager.temp_voice_channels.triggers.indexOf(trigger)

    if (trigger_index >= 2 && !server.server.premium.available) {
        await state.disconnect()

        return false
    }

    if (trigger && state.guild.me.permissions.has(self.PERMISSIONS_FLAGS.MANAGE_CHANNELS)) {
        const children = trigger.children.find(c => c.owner_id == state.member.id)

        if (children) {
            const channel = state.guild.channels.cache.get(children.channel_id)

            if (channel && channel.manageable) await state.member.voice.setChannel(children.channel_id)

            self.emit('moduleExecution', { module: 'Temp Voice: Move', guild: { id: state.guild.id, name: state.guild.name }, target: { id: state.member.id, name: state.member.user.tag } })

            return true
        }

        if ((trigger.allowed_roles?.length && !state.member.roles.cache.some(r => trigger.allowed_roles?.includes(r.id))) || state.member.roles.cache.some(r => trigger.blocked_roles?.includes(r.id))) {
            await state.disconnect()

            return false
        }

        const parent = trigger.default.category_id ? state.guild.channels.cache.filter(c => c.type == 'GUILD_CATEGORY').get(trigger.default.category_id) : state.channel.parent
        const replacer = new Replacer(self, trigger.default.name, { guild: state.guild, member: state.member, index: trigger.children.length + 1 })
        const name = await replacer.replace()
        const permissions = new Permissions(BigInt(trigger.default.permissions))
        
        const temp_voice = await state.guild.channels.create(truncateString(name, 100, '') || 'Voice', {
            type: 'GUILD_VOICE',
            permissionOverwrites: state.channel.permissionOverwrites.cache,
            parent: parent && parent.manageable ? parent as CategoryChannelResolvable : null,
            userLimit: trigger.default.limit,
            bitrate: state.channel.bitrate
        })

        if (trigger.default.permissions) {
            await temp_voice.permissionOverwrites.create(state.member.id, permissions.toArray().reduce((obj, k) => { obj[k] = true; return obj }, {}))

            if (trigger?.moderator_roles?.length) {
                const roles = trigger.moderator_roles.filter(mr => state.guild.roles.cache.some(r => r.editable && r.id == mr))

                for (const role of roles) {
                    const overwrites = temp_voice.permissionOverwrites.cache.find(p => p.id == role)

                    if (overwrites) await overwrites.edit(permissions.toArray().reduce((obj, k) => { obj[k] = true; return obj }, {}))
                    else await temp_voice.permissionOverwrites.create(role, permissions.toArray().reduce((obj, k) => { obj[k] = true; return obj }, {}))
                }
            }
        }

        if (trigger.default.position == 'TOP') await temp_voice.setPosition(0)

        await self.db.servers.updateOne({ _id: state.guild.id, 'modules.voice_manager.temp_voice_channels.triggers.id': trigger.id }, {
            $push: {
                'modules.voice_manager.temp_voice_channels.triggers.$.children': {
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
    const trigger: VoiceChannelTrigger = server.modules.voice_manager.temp_voice_channels.triggers.find(t => t.channel_id == state.channelId)
    const before_trigger: VoiceChannelTrigger = server.modules.voice_manager.temp_voice_channels.triggers.find(t => t.children.some(c => c.channel_id == before.channelId))

    if (trigger && state.guild.me.permissions.has('MANAGE_CHANNELS')) {
        const children: VoiceChannelTriggerChildren = trigger.children.find(c => c.owner_id == state.member.id)

        if (children) {
            const channel = state.guild.channels.cache.get(children.channel_id)

            if (channel && channel.manageable) await state.setChannel(children.channel_id)

            self.emit('moduleExecution', { module: 'Temp Voice: Move', guild: { id: state.guild.id, name: state.guild.name }, target: { id: state.member.id, name: state.member.user.tag } })

            return true
        }

        await createTemporaryVoice(self, server, state)
    
        return true
    }

    if (before_trigger && state.guild.me.permissions.has('MANAGE_CHANNELS')) {
        const trigger_children: VoiceChannelTriggerChildren = before_trigger.children.find(c => c.channel_id == before.channelId)
        const channel = state.guild.channels.cache.get(trigger_children.channel_id) as BaseGuildVoiceChannel

        if (channel && state.channelId == before_trigger.channel_id && trigger_children.owner_id == state.member.id) {
            if (channel.manageable) await state.setChannel(trigger_children.channel_id, '')

            self.emit('moduleExecution', { module: 'Temp Voice: Move', guild: { id: state.guild.id, name: state.guild.name }, target: { id: state.member.id, name: state.member.user.tag } })

            return true
        }

        if (trigger_children && channel && !channel.members.size) {
            await self.db.servers.updateOne({ _id: state.guild.id, 'modules.voice_manager.temp_voice_channels.triggers.id': before_trigger.id }, {
                $pull: {
                    'modules.voice_manager.temp_voice_channels.triggers.$.children': {
                        channel_id: trigger_children.channel_id
                    }
                }
            })

            if (channel.deletable) await channel.delete()

            self.emit('moduleExecution', { module: 'Temp Voice: Delete', guild: { id: channel.guild.id, name: channel.guild.name }, target: { id: channel.id, name: channel.name } })
        }

        else if (trigger_children && channel && channel.members.size) {
            const children_index = before_trigger.children.indexOf(trigger_children)

            await self.db.servers.updateOne({ _id: state.guild.id, 'modules.voice_manager.temp_voice_channels.triggers.id': before_trigger.id }, {
                $set: {
                    [`modules.voice_manager.temp_voice_channels.triggers.$.children.${children_index}.owner_id`]: channel.members.first().id
                }
            })
        }

        return true
    }

    return false
}

export async function deleteTemporaryVoice(self: Lacuna, server: ServerDocument, channel: VoiceChannel) {
    const trigger: VoiceChannelTrigger = server.modules.voice_manager.temp_voice_channels.triggers.find(t => t.children.some(c => c.channel_id == channel?.id))

    if (trigger && channel.guild.me.permissions.has('MANAGE_CHANNELS')) {
        const trigger_children: VoiceChannelTriggerChildren = trigger.children.find(c => c.channel_id == channel.id)

        if (trigger_children && !channel.members.size) {
            await self.db.servers.updateOne({ _id: channel.guild.id, 'modules.voice_manager.temp_voice_channels.triggers.id': trigger.id }, {
                $pull: {
                    'modules.voice_manager.temp_voice_channels.triggers.$.children': {
                        channel_id: trigger_children.channel_id
                    }
                }
            })

            if (channel.deletable) await channel.delete()

            self.emit('moduleExecution', { module: 'Temp Voice: Delete', guild: { id: channel.guild.id, name: channel.guild.name }, target: { id: channel.id, name: channel.name } })
        }

        else if (trigger_children && channel.members.size) {
            const children_index: number = trigger.children.indexOf(trigger_children)

            await self.db.servers.updateOne({ _id: channel.guild.id, 'modules.voice_manager.temp_voice_channels.triggers.id': trigger.id }, {
                $set: {
                    [`modules.voice_manager.temp_voice_channels.triggers.$.children.${children_index}.owner_id`]: channel.members.first().id
                }
            })

            const overwrites = channel.permissionOverwrites.cache.find(p => p.id === trigger_children.owner_id)
            if (overwrites) await overwrites.delete()

            const permissions = new Permissions(BigInt(trigger.default.permissions))
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