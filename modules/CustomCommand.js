const { Util } = require('discord.js')
const Replacer = require('./Replacer')

class CustomCommand {
    /**
     * @param {import('../internals/Typings').CustomCommand} command
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Message} message
     * @param {String[]} args
     */
    constructor(command, self, server, message, args) {
        this.command = command

        this.self = self

        this.server = server

        this.message = message

        this.args = args
    }

    async execute() {
        if (this.command.blocked.channels.includes(this.message.channel.id) || this.message.member.roles.cache.some(r => this.command.blocked.roles.includes(r.id))) return false
        if (this.command.allowed.channels.length && !this.command.allowed.channels.includes(this.message.channel.id)) return false
        if (this.command.allowed.roles.length && !this.message.member.roles.cache.some(r => this.command.allowed.roles.includes(r.id))) return false

        for (const component of this.command.components) {
            if (component.type == 'CONDITION') {
                if (component.condition.type == 'COMPARE') {
                    const replacer_left = new Replacer(this.self, component.condition.compare.left, { message: this.message, guild: this.message.guild, member: this.message.member })
                    const replacer_right = new Replacer(this.self, component.condition.compare.right, { message: this.message, guild: this.message.guild, member: this.message.member })

                    component.condition.compare.left = await replacer_left.replace()
                    component.condition.compare.right = await replacer_right.replace()

                    switch (component.condition.compare.operator) {
                        case '==': {
                            if (!Boolean(component.condition.compare.left == component.condition.compare.right)) return false
                            break
                        }
                        case '!=': {
                            if (!Boolean(component.condition.compare.left != component.condition.compare.right)) return false
                            break
                        }
                        case '>': {
                            if (!Boolean(component.condition.compare.left > component.condition.compare.right)) return false
                            break
                        }
                        case '<': {
                            if (!Boolean(component.condition.compare.left < component.condition.compare.right)) return false
                            break
                        }
                        case '^': {
                            if (!component.condition.compare.left.startsWith(component.condition.compare.right)) return false
                            break
                        }
                        case '$': {
                            if (!component.condition.compare.left.endsWith(component.condition.compare.right)) return false
                            break
                        }
                        case '~': {
                            if (component.condition.compare.left.includes(component.condition.compare.right)) return false
                            break
                        }
                        case '!~': {
                            if (!component.condition.compare.left.includes(component.condition.compare.right)) return false
                            break
                        }
                    }
                }

                if (component.condition.type == 'USER') {
                    if (component.condition.user.condition == 'HAS_ROLES') {
                        if (component.condition.user.roles.some(v => this.message.member.roles.cache.has(v))) return false
                    }

                    if (component.condition.user.condition == 'MISSING_ROLES') {
                        if (component.condition.user.roles.some(v => !this.message.member.roles.cache.has(v))) return false
                    }

                    if (component.condition.user.condition == 'HAS_PERMISSIONS') {
                        if (this.message.member.permissions.has(component.condition.user.permissions, false)) return false
                    }

                    if (component.condition.user.condition == 'MISSING_PERMISSIONS') {
                        if (!this.message.member.permissions.has(component.condition.user.permissions, false)) return false
                    }
                }

                if (component.condition.type == 'IF_ELSE') {
                    if (component.condition.if_else.condition.type) {
                        let value = false

                        const replacer_left = new Replacer(this.self, component.condition.if_else.condition.compare.left, { message: this.message, guild: this.message.guild, member: this.message.member })
                        const replacer_right = new Replacer(this.self, component.condition.if_else.condition.compare.right, { message: this.message, guild: this.message.guild, member: this.message.member })
    
                        component.condition.if_else.condition.compare.left = await replacer_left.replace()
                        component.condition.if_else.condition.compare.right = await replacer_right.replace()

                        if (component.condition.if_else.condition.type == 'COMPARE') {
                            switch (component.condition.if_else.condition.compare.operator) {
                                case '==': {
                                    value = component.condition.if_else.condition.compare.left == component.condition.if_else.condition.compare.right
                                    break
                                }
                                case '!=': {
                                    value = component.condition.if_else.condition.compare.left != component.condition.if_else.condition.compare.right
                                    break
                                }
                                case '>': {
                                    value = component.condition.if_else.condition.compare.left > component.condition.if_else.condition.compare.right
                                    break
                                }
                                case '<': {
                                    value = component.condition.if_else.condition.compare.left < component.condition.if_else.condition.compare.right
                                    break
                                }
                                case '^': {
                                    value = component.condition.if_else.condition.compare.left.startsWith(component.condition.if_else.condition.compare.right)
                                    break
                                }
                                case '$': {
                                    value = component.condition.if_else.condition.compare.left.endsWith(component.condition.if_else.condition.compare.right)
                                    break
                                }
                                case '~': {
                                    value = component.condition.if_else.condition.compare.left.includes(component.condition.if_else.condition.compare.right)
                                    break
                                }
                                case '!~': {
                                    value = component.condition.if_else.condition.compare.left.includes(component.condition.if_else.condition.compare.right)
                                    break
                                }
                            }
                        }
        
                        if (component.condition.if_else.condition.type == 'USER') {
                            if (component.condition.if_else.condition.user.condition == 'HAS_ROLES') {
                                value = component.condition.if_else.condition.user.roles.some(v => this.message.member.roles.cache.has(v))
                            }
        
                            if (component.condition.if_else.condition.user.condition == 'MISSING_ROLES') {
                                value = component.condition.if_else.condition.user.roles.some(v => !this.message.member.roles.cache.has(v))
                            }

                            if (component.condition.if_else.condition.user.condition == 'HAS_PERMISSIONS') {
                                value = this.message.member.permissions.has(component.condition.if_else.condition.user.permissions, false)
                            }

                            if (component.condition.if_else.condition.user.condition == 'MISSING_PERMISSIONS') {
                                value = !this.message.member.permissions.has(component.condition.if_else.condition.user.permissions, false)
                            }
                        }

                        console.log(value)

                        if (value && component.condition.if_else.actions.length) {
                            for (const if_component of component.condition.if_else.actions) {
                                if (if_component.action.type == 'REPLY') {
                                    const i = component.condition.if_else.actions.filter(c => c.action.type == 'REPLY').indexOf(if_component)
                
                                    if (i < 2 && (if_component.action.reply.message.content || if_component.action.reply.message.embed.active)) {
                                        const replacer = new Replacer(this.self, null, { guild: this.message.guild, message: this.message, member: this.message.member })
                                        const content = await replacer.replaceTemplateMessage({ content: if_component.action.reply.message.content, embed: if_component.action.reply.message.embed })
                
                                        if (if_component.action.reply.format == 'CURRENT_CHANNEL') {
                                            await this.message.channel.send(null, { ...content, tts: if_component.action.reply.message.tts }).catch(this.self.logger.error)
                                        }
                
                                        if (if_component.action.reply.format == 'CHANNEL' && if_component.action.reply.channel_id) {
                                            const channel = this.message.guild.channels.cache.get(if_component.action.reply.channel_id)
                
                                            if (channel) await channel.send(null, { ...content, tts: if_component.action.reply.message.tts }).catch(this.self.logger.error)
                                        }
                                    }
                                }
                
                                if (if_component.action.type == 'MODIFY_ROLES') {
                                    const i = component.condition.if_else.actions.filter(c => c.action.type == 'MODIFY_ROLES').indexOf(if_component)
                
                                    if (i < 2 && (if_component.action.modify_roles.add.length || if_component.action.modify_roles.remove.length)) {
                                        if (if_component.action.modify_roles.add.length) {
                                            const editable = this.message.guild.roles.cache.filter(r => r.editable && if_component.action.modify_roles.add.includes(r.id))
                
                                            if (editable.size) await this.message.member.roles.add(editable).catch(this.self.logger.error)
                                        }
                
                                        if (if_component.action.modify_roles.remove.length) {
                                            const editable = this.message.guild.roles.cache.filter(r => r.editable && if_component.action.modify_roles.remove.includes(r.id))
                
                                            if (editable.size) await this.message.member.roles.remove(editable).catch(this.self.logger.error)
                                        }
                                    }
                                }
                
                                if (if_component.action.type == 'ADD_REACTIONS') {
                                    const i = component.condition.if_else.actions.filter(c => c.action.type == 'ADD_REACTIONS').indexOf(if_component)
                
                                    if (i < 2 && if_component.action.add_reactions.length && !this.message.deleted) {
                                        for (let reaction of if_component.action.add_reactions.slice(0, 5)) {
                                            reaction = Util.parseEmoji(reaction)
                                            await this.message.react(reaction.id || reaction.name).catch(this.self.logger.error)
                                        }
                                    }
                                }
                
                                if (if_component.action.type == 'FORWARD_TO_COMMAND') {
                                    const i = component.condition.if_else.actions.filter(c => c.action.type == 'FORWARD_TO_COMMAND').indexOf(if_component)
                
                                    if (i == 0 && if_component.action.forward_to_command) {
                                        const replacer = new Replacer(this.self, if_component.action.forward_to_command, { message: this.message, guild: this.message.guild, member: this.message.member })
                                        const replaced = await replacer.replace()
                            
                                        const splitted = replaced.split(' ')
                                        const name = splitted[0].toLowerCase()
                                        const args = splitted.slice(1).filter(arg => arg)
                            
                                        const command = this.self.commands.get(name)
                            
                                        if (command) await command.execute(this.server, this.message, args)
                                    }
                                }
                
                                if (if_component.action.type == 'DELETE_REQUEST') {
                                    const i = component.condition.if_else.actions.filter(c => c.action.type == 'DELETE_REQUEST').indexOf(if_component)
                
                                    if (i == 0 && if_component.action.delete_request < 0) {
                                        if (this.message.deletable && !this.message.deleted) {
                                            const timeout = if_component.action.delete_request
                
                                            if (!isNaN(timeout)) await this.message.delete({ timeout: timeout ? timeout * 1000 : 0 }).catch(this.self.logger.error)
                                        }
                                    }
                                }
                            }

                            return true
                        }
                    }
                }
            }

            if (component.type == 'ACTION') {
                if (component.action.type == 'REPLY') {
                    const i = this.command.components.filter(c => c.action?.type == 'REPLY').indexOf(component)

                    if (i < 2 && (component.action.reply.message.content || component.action.reply.message.embed.active)) {
                        const replacer = new Replacer(this.self, null, { guild: this.message.guild, message: this.message, member: this.message.member })
                        const content = await replacer.replaceTemplateMessage({ content: component.action.reply.message.content, embed: component.action.reply.message.embed })

                        if (component.action.reply.format == 'CURRENT_CHANNEL') {
                            await this.message.channel.send(null, { ...content, tts: component.action.reply.message.tts }).catch(this.self.logger.error)
                        }

                        if (component.action.reply.format == 'CHANNEL' && component.action.reply.channel_id) {
                            const channel = this.message.guild.channels.cache.get(component.action.reply.channel_id)

                            if (channel) await channel.send(null, { ...content, tts: component.action.reply.message.tts }).catch(this.self.logger.error)
                        }
                    }
                }

                if (component.action.type == 'MODIFY_ROLES') {
                    const i = this.command.components.filter(c => c.action?.type == 'MODIFY_ROLES').indexOf(component)

                    if (i < 2 && (component.action.modify_roles.add.length || component.action.modify_roles.remove.length)) {
                        if (component.action.modify_roles.add.length) {
                            const editable = this.message.guild.roles.cache.filter(r => r.editable && component.action.modify_roles.add.includes(r.id))

                            if (editable.size) await this.message.member.roles.add(editable).catch(this.self.logger.error)
                        }

                        if (component.action.modify_roles.remove.length) {
                            const editable = this.message.guild.roles.cache.filter(r => r.editable && component.action.modify_roles.remove.includes(r.id))

                            if (editable.size) await this.message.member.roles.remove(editable).catch(this.self.logger.error)
                        }
                    }
                }

                if (component.action.type == 'ADD_REACTIONS') {
                    const i = this.command.components.filter(c => c.action?.type == 'ADD_REACTIONS').indexOf(component)

                    if (i < 2 && component.action.add_reactions.length && !this.message.deleted) {
                        for (let reaction of component.action.add_reactions.slice(0, 5)) {
                            reaction = Util.parseEmoji(reaction)
                            await this.message.react(reaction.id || reaction.name).catch(this.self.logger.error)
                        }
                    }
                }

                if (component.action.type == 'FORWARD_TO_COMMAND') {
                    const i = this.command.components.filter(c => c.action?.type == 'FORWARD_TO_COMMAND').indexOf(component)

                    if (i == 0 && component.action.forward_to_command) {
                        const replacer = new Replacer(this.self, component.action.forward_to_command, { message: this.message, guild: this.message.guild, member: this.message.member })
                        const replaced = await replacer.replace()
            
                        const splitted = replaced.split(' ')
                        const name = splitted[0].toLowerCase()
                        const args = splitted.slice(1).filter(arg => arg)
            
                        const command = this.self.commands.get(name)
            
                        if (command) await command.execute(this.server, this.message, args)
                    }
                }

                if (component.action.type == 'DELETE_REQUEST') {
                    const i = this.command.components.filter(c => c.action?.type == 'DELETE_REQUEST').indexOf(component)

                    if (i == 0 && component.action.delete_request > 0) {
                        if (this.message.deletable && !this.message.deleted) {
                            const timeout = component.action.delete_request

                            if (!isNaN(timeout)) await this.message.delete({ timeout: timeout ? timeout * 1000 : 0 }).catch(this.self.logger.error)
                        }
                    }
                }
            }
        }

        return true
    }
}

module.exports = CustomCommand