class Command {
    /**
     * @param {import('../Lacuna')} self
     * @param {import('../Typings').CommandInfo} data
     */
    constructor(self, data) {
        this.self = self

        this.prefix = data.prefix

        this.slash = data.slash

        this.user = data.user

        this.message = data.message

        this.name = data.name

        this.pretty_name = data.pretty_name

        this.description = data.description

        this.type = data.type

        this.options = data.options

        this.default_permission = Boolean(data.default_permission)

        this.group = data.group ?? 'GENERAL'

        this.is_prefix_command = Boolean(data.prefix)

        this.is_slash_command = Boolean(data.slash)

        this.is_user_command = Boolean(data.user)

        this.is_message_command = Boolean(data.message)

        this.subcommands = data.subcommands ?? []

        this.uses = 0

        this.premium_only = Boolean(data.premium_only)

        this.private = Boolean(data.private)

        this.throttling = data.throttling ?? null

        this.throttles = data.throttling ? new Map() : null

        this.permissions = {
            self: data.permissions?.self ?? [],
            user: data.permissions?.user ?? []
        }

        this.self.commands.set(this.name, this)
    }

    /**
     * @param {import('../Typings').ServerDocument} server
     * @param {import('discord.js').CommandInteraction | import('discord.js').ContextMenuInteraction | import('discord.js').Message} signal
     */
    denied(server, signal) {
        const command = server.commands.system.find(c => c.name == this.name)

        if (this.self.application.owner.members.some(m => m.id == signal.member.id)) return true

        if (this.private) return false

        if (server.commands.permissions.blocked.channels.includes(signal.channel.id) && !signal.member.permissions.has('ADMINISTRATOR')) return false

        if ((server.commands.permissions.allowed.channels.length && !server.commands.permissions.allowed.channels.includes(signal.channel.id)) && !signal.member.permissions.has('ADMINISTRATOR')) return false

        if (command) {
            if (command.inactive) return false

            if (command.blocked.channels.includes(signal.channel.id)) return false

            if (command.allowed.channels.length && !command.allowed.channels.includes(signal.channel.id)) return false

            if (signal.member.roles.cache.some(r => command.blocked.roles.includes(r.id))) return false
        }

        return true
    }

    /**
     * @param {import('../Typings').ServerDocument} server
     * @param {import('discord.js').CommandInteraction | import('discord.js').ContextMenuInteraction | import('discord.js').Message} signal
     */
    allowed(server, signal) {
        const command = server.commands.system.find(c => c.name == this.name)

        if (this.self.application.owner.members.some(m => m.id == signal.member.id)) return true

        if (command) {
            if (command.allowed.roles.length && signal.member.roles.cache.some(r => command.allowed.roles.includes(r.id))) return true

            if (!command.allowed.roles.length && !this.permissions.user.length) return true
        }

        if (!command && !this.permissions.user.length) return true

        if (this.permissions.user.length && signal.member.permissions.has(this.permissions.user)) return true

        return false
    }

    /**
     * @param {import('../Typings').ServerDocument} server
     * @param {import('discord.js').CommandInteraction} interaction
     */
    async executeSlash(server, interaction) {
        const locale = this.self.translator.locale(server.locale)

        const denied = this.denied(server, interaction), allowed = this.allowed(server, interaction)

        if (!denied || !allowed) {
            await interaction.reply({ content: `${this.self._emojis.ERROR} | ${this.self.translator.format(locale.commands.common.texts.command_denied, `**${interaction.user.tag}**`)}`, ephemeral: true })

            return false
        }

        if (this.premium_only && !server.server.premium.available) {
            await interaction.reply({ content: `${this.self._emojis.ERROR} | ${this.self.translator.format(locale.commands.common.texts.premium_only, `**${interaction.user.tag}**`)}`, ephemeral: true })

            return false
        }

        this.uses++

        const sc = this.subcommands.length ? interaction.options?.getSubcommand() : null
        const subcommand = this.subcommands?.find(s => s.name == sc)

        if (subcommand) await subcommand.slash(this.self, server, interaction)
        else await this.slash(this.self, server, interaction)

        this.self.emit('commandExecution', {
            command: subcommand ? `${this.name} ${subcommand.name}` : this.name,
            guild: { name: interaction.guild.name, id: interaction.guild.id },
            channel: { name: interaction.channel?.name, id: interaction.channelId },
            user: { name: interaction.user.username, id: interaction.user.id }
        })

        return true
    }

    /**
     * @param {import('../Typings').ServerDocument} server
     * @param {import('discord.js').ContextMenuInteraction} interaction
     */
    async executeContext(server, interaction) {
        const locale = this.self.translator.locale(server.locale)

        const denied = this.denied(server, interaction), allowed = this.allowed(server, interaction)

        if (!denied || !allowed) {
            await interaction.reply({ content: `${this.self._emojis.ERROR} | ${this.self.translator.format(locale.commands.common.texts.command_denied, `**${interaction.user.tag}**`)}`, ephemeral: true })

            return false
        }

        if (this.premium_only && !server.server.premium.available) {
            await interaction.reply({ content: `${this.self._emojis.ERROR} | ${this.self.translator.format(locale.commands.common.texts.premium_only, `**${interaction.user.tag}**`)}`, ephemeral: true })

            return false
        }

        this.uses++

        if (interaction.targetType == 'MESSAGE') await this.message(this.self, server, interaction)
        if (interaction.targetType == 'USER') await this.user(this.self, server, interaction)

        this.self.emit('commandExecution', {
            command: this.name,
            guild: { name: interaction.guild.name, id: interaction.guild.id },
            channel: { name: interaction.channel?.name, id: interaction.channelId },
            user: { name: interaction.user.username, id: interaction.user.id }
        })

        return true
    }


    /**
     * @param {import('../Typings').ServerDocument} server
     * @param {import('discord.js').Message} message
     */
    async executePrefix(server, message) {
        if (!message.content.startsWith(server.prefix)) return false

        const locale = this.self.translator.locale(server.locale)

        const denied = this.denied(server, message), allowed = this.allowed(server, message)

        if (!denied || !allowed) return false

        if (this.permissions.self.length && !message.guild.me.permissions.has(this.permissions.self)) {
            const missing = message.channel.permissionsFor(message.guild.me).missing(this.permissions.self)

            if (missing.includes('SEND_MESSAGES')) {
                await message.author.send({ content: `${this.self._emojis.ERROR} | ${this.self.translator.format(locale.commands.common.texts.missing_send_messages, `**${message.member.displayName}**`, `<#${message.channelId}>`)}` }).catch(() => {})

                return false
            }

            if (missing) {
                await message.reply({ content: `${this.self._emojis.ERROR} | ${this.self.translator.format(locale.commands.common.texts.missing_permissions, `**${message.member.displayName}**`, missing.map(p => `\`${locale.commands.common.permissions[p]?.toLowerCase()}\``).join(', '))}` })

                return false
            }
        }

        if (this.premium_only && !server.server.premium.available) {
            await interaction.reply({ content: `${this.self._emojis.ERROR} | ${this.self.translator.format(locale.commands.common.texts.premium_only, `**${message.author.tag}**`)}`, ephemeral: true })

            return false
        }

        this.uses++

        const subcommand = this.subcommands?.find(sc => sc.name == message.args[0])

        if (subcommand) {
            message.args = message.args.slice(1)

            await subcommand.prefix(this.self, server, message)
        }

        else await this.prefix(this.self, server, message)
        
        this.self.emit('commandExecution', {
            command: subcommand ? `${this.name} ${subcommand.name}` : this.name,
            guild: { name: message.guild.name, id: message.guild.id },
            channel: { name: message.channel.name, id: message.channelId },
            user: { name: message.author.username, id: message.author.id }
        })

        return true
    }

    /**
     * @param {string} guild_id
     */
    async fetchConfig(guild_id) {
        const server = await this.self.db.servers.fetch({ _id: guild_id })

        const config = server.commands.system.find(c => c.name == this.name)

        if (!config) {
            await this.self.db.servers.update({ _id: guild_id }, {
                $push: {
                    'commands.system': {
                        name: this.name,
                        inactive: false,
                        throttle: {
                            type: 'PER_CHANNEL',
                            usages: 0,
                            duration: 0
                        },
                        delete_command: { active: false, after_ms: 0 },
                        delete_reply: { active: false, after_ms: 0 },
                        allowed: { channels: [], roles: [] },
                        blocked: {  channels: [], roles: [] }
                    }
                }
            })
        }

        return config || {
            name: this.name,
            inactive: false,
            throttle: {
                type: 'PER_CHANNEL',
                usages: 0,
                duration: 0
            },
            delete_command: { active: false, after_ms: 0 },
            delete_reply: { active: false, after_ms: 0 },
            allowed: { channels: [], roles: [] },
            blocked: {  channels: [], roles: [] }
        }
    }

    /**
     * @param {string} guild_id
     * @param {Object} data
     * @param {'CHANNEL'|'ROLE'} data.type
     * @param {string} data.reference
     * @param {boolean} data.remove
     */
    async allow(guild_id, data = { type: '', reference: '', remove: false }) {
        if (!guild_id) throw new TypeError('Invalid arguments')

        await this.fetchConfig(guild_id)

        if (data.reference && data.type) {
            if (data.type == 'CHANNEL') {
                this.self.db.servers.update({ _id: guild_id, 'commands.system.name': this.name }, {
                    [data.remove ? '$pull' : '$push']: {
                        'commands.system.$.allowed.channels': data.reference
                    }
                })
            }

            if (data.type == 'ROLE') {
                this.self.db.servers.update({ _id: guild_id, 'commands.system.name': this.name }, {
                    [data.remove ? '$pull' : '$push']: {
                        'commands.system.$.allowed.roles': data.reference
                    }
                })
            }

            return null
        }

        await this.self.db.servers.update({ _id: guild_id, 'commands.system.name': this.name }, {
            $set: {
                'commands.system.$.inactive': false
            }
        })
    }

    /**
     * @param {string} guild_id
     * @param {Object} data
     * @param {'CHANNEL'|'ROLE'} data.type
     * @param {string} data.reference
     * @param {boolean} data.remove
     */
    async block(guild_id, data = { type: '', reference: '', remove: false }) {
        if (!guild_id) throw new TypeError('Invalid arguments')

        await this.fetchConfig(guild_id)

        if (data.reference && data.type) {
            if (data.type == 'CHANNEL') {
                this.self.db.servers.update({ _id: guild_id, 'commands.system.name': this.name }, {
                    [data.remove ? '$pull' : '$push']: {
                        'commands.system.$.blocked.channels': data.reference
                    }
                })
            }

            if (data.type == 'ROLE') {
                this.self.db.servers.update({ _id: guild_id, 'commands.system.name': this.name }, {
                    [data.remove ? '$pull' : '$push']: {
                        'commands.system.$.blocked.roles': data.reference
                    }
                })
            }

            return null
        }

        await this.self.db.servers.update({ _id: guild_id, 'commands.system.name': this.name }, {
            $set: {
                'commands.system.$.inactive': true
            }
        })
    }
}

module.exports = Command