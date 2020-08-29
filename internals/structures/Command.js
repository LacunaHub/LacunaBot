const { Collection } = require('discord.js')
const Subcommand = require('./Subcommand')

class Command {
    /**
     * @param {import('../Lacuna')} self
     * @param {import('../Typings').CommandInfo} data
     */
    constructor(self, data) {
        if (!self || (!data.fn || typeof data.fn !== 'function') || (!data.name || typeof data.name !== 'string')) {
            throw new TypeError('Incorrect arguments has provided. Please, check arguments and fix it.')
        }

        this.self = self

        this.fn = data.fn

        this.name = data.name

        this.group = data.group || null

        this.description = data.description || null

        this.aliases = data.aliases || []

        /**
         * @type {Collection<String, Subcommand>}
         */
        this.subcommands = new Collection()

        this.uses = 0

        this.guild_only = Boolean(data.guild_only)

        this.developer_only = Boolean(data.developer_only)

        this.premium_only = Boolean(data.premium_only)

        this.private = Boolean(data.private)

        this.nsfw = Boolean(data.nsfw)

        this.throttling = data.throttling || null

        this.throttles = new Map()

        this.self_permissions = data.self_permissions || []

        this.user_permissions = data.user_permissions || []

        this.early_access = data.early_access || null

        this.self.commands.set(this.name, this)
    }

    /**
     * Проверяет, имеет ли бот все нужные разрешения для выполнения команды
     * 
     * @param {import('discord.js').Message} message
     * @returns {?import('discord.js').PermissionResolvable[]}
     */
    hasPermission(message) {
        if (this.self_permissions && !message.guild.me.hasPermission(this.self_permissions)) {
            const missing = message.channel.permissionsFor(this.self.user).missing(this.self_permissions)

            if (missing) return missing
        }

        return null
    }

    /**
     * Проверяет конфигурацию команды на наличие запретов
     * 
     * @param {import('../Typings').ServerDocument} server
     * @param {import('discord.js').Message} message
     */
    denied(server, message) {
        const command = server.commands.system.find(c => c.name == this.name)

        if (this.developer_only && !this.self.application.owner.members.some(m => m.id == message.author.id)) return false

        if (this.guild_only && !message.guild) return false

        if (server.commands.permissions.blocked.channels.includes(message.channel.id) && !message.member.hasPermission('ADMINISTRATOR')) return false

        if ((server.commands.permissions.allowed.channels.length && !server.commands.permissions.allowed.channels.includes(message.channel.id)) && !message.member.hasPermission('ADMINISTRATOR')) return false

        if (command) {
            if (!command.active) return false

            if (command.blocked.channels.includes(message.channel.id)) return false

            if (command.allowed.channels.length && !command.allowed.channels.includes(message.channel.id)) return false

            if (message.member.roles.some(r => command.blocked.roles.includes(r.id))) return false
        }

        return true
    }

    /**
     * Проверяет конфигурацию команды на наличие ограничений
     * 
     * @param {import('../Typings').ServerDocument} server
     * @param {import('discord.js').Message} message
     */
    allowed(server, message) {
        const command = server.commands.system.find(c => c.name == this.name)

        if (command) {
            if (command.allowed.roles.length && message.member.roles.some(r => command.allowed.roles.includes(r.id))) return true

            if (!command.allowed.roles.length && !this.user_permissions) return true
        }

        if (!command && !this.user_permissions) return true

        if (this.user_permissions && message.member.hasPermission(this.user_permissions)) return true

        return false
    }

    /**
     * Обработка и выполнение команды
     * 
     * @param {import('../Typings').ServerDocument} server
     * @param {import('discord.js').Message} message
     * @param {String[]} args
     */
    async execute(server, message, args) {
        if (!message.content.startsWith(server.prefix)) return false

        const locale = this.self.translator.locale(server.locale)

        if (this.early_access && this.early_access >= Date.now() && !server.server.premium.available) return false

        if (!this.denied(server, message) || !this.allowed(server, message)) return false

        const missing = this.hasPermission(message)

        if (missing) {
            if (missing.includes('SEND_MESSAGES')) return false

            await message.channel.send(`${this.self._emojis.WARNING} | ${this.self.translator.format(locale.commands.common.texts.missing_permissions, `**${message.author.username}**`, missing.map(p => `\`${locale.commands.common.permissions[p]}\``).join(', '))}`)

            return false
        }

        if (this.premium_only && !server.server.premium.available) {
            await message.channel.send(`${this.self._emojis.ERROR} | ${this.self.translator.format(locale.commands.common.texts.premium_only, `**${message.author.username}**`)}`)

            return false
        }

        let result

        const subcommand = this.subcommands.find(c => c.name == args[0] || (c.aliases && c.aliases.includes(args[0])))

        if (subcommand) {
            result = await subcommand.fn(this.self, server, message, args.slice(1))
        }

        else {
            result = await this.fn(this.self, server, message, args)
        }

        this.uses++

        if (result) await this.self.emit('commandExecution', { command: { name: this.name, uses: this.uses }, message: message, args: args })

        return true
    }
}

module.exports = Command