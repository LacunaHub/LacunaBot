const { Permissions } = require('discord.js')

class VoiceManager {
    /**
     * Создаёт временный голосовой канал
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').VoiceState} state
     */
    static async CreateTempVoice(self, server, state) {
        const trigger = server.modules.voice_manager.temp_voice_channels.triggers.find(t => t.channel_id == state.channelID)
        const trigger_index = server.modules.voice_manager.temp_voice_channels.triggers.indexOf(trigger)

        if (trigger_index >= 2 && !server.server.premium.available) return false

        if (trigger && state.guild.me.hasPermission('MANAGE_CHANNELS')) {
            const children = trigger.children.find(c => c.owner_id == state.member.id)

            if (children) {
                const channel = state.guild.channels.cache.get(children.channel_id)

                if (channel && channel.manageable) await state.member.voice.setChannel(children.channel_id)

                await self.emit('moduleExecution', { module: 'Temp Voice: Move', guild: { id: state.guild.id, name: state.guild.name }, target: { id: state.member.id, name: state.member.user.tag } })

                return true
            }

            const parent = state.channel.parent
            
            const temp_voice = await state.guild.channels.create(`${trigger.default.name} #${trigger.children.length + 1}`, {
                type: 'voice',
                permissionOverwrites: trigger.default.permissions ? state.channel.permissionOverwrites.set(state.member.id, { type: 'member', id: state.member.id, allow: new Permissions(trigger.default.permissions) }) : state.channel.permissionOverwrites,
                parent: parent && parent.manageable ? parent : null,
                userLimit: trigger.default.limit,
                bitrate: state.channel.bitrate,
                reason: ''
            })

            await state.channel.permissionOverwrites.delete(state.member.id)

            await self.db.servers.update({ _id: state.guild.id, 'modules.voice_manager.temp_voice_channels.triggers.id': trigger.id }, {
                $push: {
                    'modules.voice_manager.temp_voice_channels.triggers.$.children': {
                        channel_id: temp_voice.id,
                        owner_id: state.member.id,
                        created_at: Date.now()
                    }
                }
            })

            const moveable = state.channel.permissionsFor(self.user.id).has('MOVE_MEMBERS') && temp_voice.permissionsFor(self.user.id).has('MOVE_MEMBERS')

            if (moveable) await state.member.voice.setChannel(temp_voice.id, '')

            await self.emit('moduleExecution', { module: 'Temp Voice: Create', guild: { id: state.guild.id, name: state.guild.name }, target: { id: state.member.id, name: state.member.user.tag } })
        
            return true
        }

        return false
    }

    /**
     * Создаёт временный голосовой канал или перемещает в него, если он уже создан
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').VoiceState} before
     * @param {import('discord.js').VoiceState} state
     */
    static async CreateTempVoiceOnMove(self, server, before, state) {
        const trigger = server.modules.voice_manager.temp_voice_channels.triggers.find(t => t.channel_id == state.channelID)
        const before_trigger = server.modules.voice_manager.temp_voice_channels.triggers.find(t => t.children.some(c => c.channel_id == before.channelID))

        if (trigger && state.guild.me.hasPermission('MANAGE_CHANNELS')) {
            const children = trigger.children.find(c => c.owner_id == state.member.id)

            if (children) {
                const channel = state.guild.channels.cache.get(children.channel_id)

                if (channel && channel.manageable) await state.member.voice.setChannel(children.channel_id)

                await self.emit('moduleExecution', { module: 'Temp Voice: Move', guild: { id: state.guild.id, name: state.guild.name }, target: { id: state.member.id, name: state.member.user.tag } })

                return true
            }

            await VoiceManager.CreateTempVoice(self, server, state)
        
            return true
        }

        if (before_trigger && state.guild.me.hasPermission('MANAGE_CHANNELS')) {
            const trigger_children = before_trigger.children.find(c => c.channel_id == before.channelID)
            const channel = state.guild.channels.cache.get(trigger_children.channel_id)

            if (channel && state.channelID == before_trigger.channel_id && trigger_children.owner_id == state.member.id) {
                if (channel.manageable) await state.member.voice.setChannel(trigger_children.channel_id, '')

                await self.emit('moduleExecution', { module: 'Temp Voice: Move', guild: { id: state.guild.id, name: state.guild.name }, target: { id: state.member.id, name: state.member.user.tag } })

                return true
            }

            if (trigger_children && channel && !channel.members.size) {
                await self.db.servers.update({ _id: state.guild.id, 'modules.voice_manager.temp_voice_channels.triggers.id': before_trigger.id }, {
                    $pull: {
                        'modules.voice_manager.temp_voice_channels.triggers.$.children': {
                            channel_id: trigger_children.channel_id
                        }
                    }
                })
    
                if (channel.deletable && !channel.deleted) await channel.delete('')

                await self.emit('moduleExecution', { module: 'Temp Voice: Delete', guild: { id: channel.guild.id, name: channel.guild.name }, target: { id: channel.id, name: channel.name } })
            }

            else if (trigger_children && channel && channel.members.size) {
                const children_index = before_trigger.children.indexOf(trigger_children)

                await self.db.servers.update({ _id: state.guild.id, 'modules.voice_manager.temp_voice_channels.triggers.id': before_trigger.id }, {
                    $set: {
                        [`modules.voice_manager.temp_voice_channels.triggers.$.children.${children_index}.owner_id`]: channel.members.first().id
                    }
                })
            }

            return true
        }

        return false
    }

    /**
     * Удаляет временный голосовой канал
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').VoiceChannel} channel
     */
    static async DeleteTempVoice(self, server, channel) {
        const trigger = server.modules.voice_manager.temp_voice_channels.triggers.find(t => t.children.some(c => c.channel_id == channel.id))

        if (trigger && channel.guild.me.hasPermission('MANAGE_CHANNELS')) {
            const trigger_children = trigger.children.find(c => c.channel_id == channel.id)

            if (trigger_children && !channel.members.size) {
                await self.db.servers.update({ _id: channel.guild.id, 'modules.voice_manager.temp_voice_channels.triggers.id': trigger.id }, {
                    $pull: {
                        'modules.voice_manager.temp_voice_channels.triggers.$.children': {
                            channel_id: trigger_children.channel_id
                        }
                    }
                })
    
                if (channel.deletable && !channel.deleted) await channel.delete('')
    
                await self.emit('moduleExecution', { module: 'Temp Voice: Delete', guild: { id: channel.guild.id, name: channel.guild.name }, target: { id: channel.id, name: channel.name } })
            }

            else if (trigger_children && channel.members.size) {
                const children_index = trigger.children.indexOf(trigger_children)

                await self.db.servers.update({ _id: channel.guild.id, 'modules.voice_manager.temp_voice_channels.triggers.id': trigger.id }, {
                    $set: {
                        [`modules.voice_manager.temp_voice_channels.triggers.$.children.${children_index}.owner_id`]: channel.members.first().id
                    }
                })

                const overwrites = channel.permissionOverwrites.find(p => p.id === trigger_children.owner_id)
                if (overwrites) await overwrites.delete()

                const permissions = {}
                for (const p of new Permissions(trigger.default.permissions).toArray()) permissions[p] = true
                await channel.createOverwrite(channel.members.first().id, permissions)
            }
        
            return true
        }

        return false
    }
}

module.exports = VoiceManager