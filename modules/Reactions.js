class Reactions {
    /**
     * Генерирует уникальный идентификатор для элемента реакций
     */
    static GenerateUID() {
        return `L${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    }

    /**
     * Находит уникальный идентификатор элемента реакций
     * 
     * @param {String} string
     */
    static ParseUID(string) {
        const match = string ? string.match(/L[A-Z0-9]{9}/) : null

        return match ? match.toString() : null
    }

    /**
     * Обрабатывает добавление меню реакций
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').MessageReaction} reaction
     * @param {import('discord.js').User} user
     */
    static async ReactionMenuAdd(self, server, reaction, user) {
        if (server.modules.reactions.length) {
            const locale = self.translator.locale(server.locale).modules

            const message = reaction.message
            const element = server.modules.reactions.find(r => r.message.id == message.id && (r.emoji.id ? r.emoji.id == reaction.emoji.id : r.emoji.name == reaction.emoji.name))

            if (element) {
                const member = await message.guild.members.fetch(user.id)

                if (element.element.lifespan && Date.now() > element.element.lifespan) {
                    await self.db.servers.update({ _id: message.guild.id }, {
                        $pull: {
                            'modules.reactions': {
                                id: element.id
                            }
                        }
                    })

                    if (message.deletable) await reaction.remove()
                    await message.reactions.cache.delete(reaction.emoji.id || reaction.emoji.name)

                    return false
                }

                if (element.type == 'CHANNEL') {
                    const channels = message.guild.channels.cache.filter(c => c.manageable && element.references.includes(c.id))

                    if (channels.size) {
                        try {
                            for (const [, channel] of channels) await channel.createOverwrite(user.id, { VIEW_CHANNEL: element.element.reverse ? true : false }, locale.reactions.show_channels_reason)
                        
                            await self.emit('moduleExecution', { module: 'Reactions: Show Channels', guild: { id: message.guild.id, name: message.guild.name }, target: { id: member.id, name: member.user.tag } })
                        } catch (err) {
                            await self.logger.error('An error occurred', err)
                            if (message.deletable) await reaction.users.remove(user.id)

                            return false
                        }
                    }
                }

                if (element.type == 'ROLE') {
                    const roles = message.guild.roles.cache.filter(r => r.editable && element.references.includes(r.id))

                    if (roles.size) {
                        if (element.element.reverse && roles.some(r => member.roles.cache.has(r.id))) {
                            try {
                                await member.roles.remove(roles, locale.reactions.remove_roles_reason)

                                await self.emit('moduleExecution', { module: 'Reactions: Remove Roles', guild: { id: message.guild.id, name: message.guild.name }, target: { id: member.id, name: member.user.tag } })
                            } catch (err) {
                                await self.logger.error('An error occurred', err)
                                if (message.deletable) await reaction.users.remove(user.id)

                                return false
                            }

                            return true
                        }

                        if (element.element.single || element.element.global_single) {
                            const single_elements = server.modules.reactions.filter(r => element.element.global_single || (element.element.single && element.message.id == message.id))
                            const has_single_element = single_elements.some(sr => sr.references.some(r => member.roles.cache.has(r)))

                            if (has_single_element) {
                                if (message.deletable) await reaction.users.remove(user.id)

                                return false
                            }

                            try {
                                await member.roles.add(roles, locale.reactions.add_roles_reason)
                            } catch (err) {
                                await self.logger.error('An error occurred', err)
                                if (message.deletable) await reaction.users.remove(user.id)

                                return false
                            }
                        }

                        else {
                            try {
                                await member.roles.add(roles, locale.reactions.add_roles_reason)
                            } catch (err) {
                                await self.logger.error('An error occurred', err)
                                if (message.deletable) await reaction.users.remove(user.id)

                                return false
                            }
                        }

                        await self.emit('moduleExecution', { module: 'Reactions: Add Roles', guild: { id: message.guild.id, name: message.guild.name }, target: { id: member.id, name: member.user.tag } })
                    }
                }
            }
        }

        return false
    }

    /**
     * Обрабатывает удаление меню реакций
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').MessageReaction} reaction
     * @param {import('discord.js').User} user
     */
    static async ReactionMenuRemove(self, server, reaction, user) {
        if (server.modules.reactions.length) {
            const locale = self.translator.locale(server.locale).modules

            const message = reaction.message
            const element = server.modules.reactions.find(r => r.message.id == message.id && (r.emoji.id ? r.emoji.id == reaction.emoji.id : r.emoji.name == reaction.emoji.name))

            if (element) {
                const member = await message.guild.members.fetch(user.id)

                if (element.type == 'CHANNEL') {
                    const channels = message.guild.channels.cache.filter(c => c.manageable && element.references.includes(c.id))

                    if (channels.size) {
                        try {
                            for (const [, channel] of channels) {
                                const overwrites = channel.permissionOverwrites.find(p => p.id == user.id)
        
                                if (overwrites) {
                                    await overwrites.delete(element.element.reverse ? locale.reactions.hide_channels_reason : locale.reactions.show_channels_reason)
            
                                    await self.emit('moduleExecution', { module: `Reactions: ${element.element.reverse ? 'Hide Channels' : 'Show Channels'}`, guild: { id: message.guild.id, name: message.guild.name }, target: { id: member.id, name: member.user.tag } })
                                }
                            }   
                        } catch (err) {
                            await self.logger.error('An error occurred', err)

                            return false
                        }
                    }
                }

                if (element.type == 'ROLE') {
                    const roles = message.guild.roles.cache.filter(r => r.editable && element.references.includes(r.id))

                    if (roles.size) {
                        try {
                            if (element.element.reverse) await member.roles.add(roles, locale.reactions.add_roles_reason)
                            else await member.roles.remove(roles, locale.reactions.remove_roles_reason)
        
                            await self.emit('moduleExecution', { module: `Reactions: ${element.element.reverse ? 'Add' : 'Remove'} Roles`, guild: { id: message.guild.id, name: message.guild.name }, target: { id: member.id, name: member.user.tag } })
                        } catch (err) {
                            await self.logger.error('An error occurred', err)

                            return false
                        }
                    }
                }
            }
        }
    }


    /**
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Message} message
     */
    static async autoReact(server, message) {
        const auto_reaction = server.modules.autoreactions.find(ar => ar.channel_id == message.channel.id)

        if (auto_reaction) {
            const content = message.content.toLowerCase()
            const split = content.split(/\s{1,}/)

            if (auto_reaction.triggers.length && !auto_reaction.triggers.some(t => split.includes(t))) return false

            for (const emoji of auto_reaction.reactions) {
                await message.react(emoji.id || emoji.name)
            }

            return true
        }

        return false
    }
}

module.exports = Reactions