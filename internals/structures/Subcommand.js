class Subcommand {
    /**
     * @param {import('./Command')} command
     * @param {import('../Typings').SubcommandInfo} data
     */
    constructor(command, data) {
        this.fn = data.fn

        this.name = data.name

        this.parent = command

        this.description = data.description

        this.aliases = data.aliases || []

        this.premium_only = Boolean(data.premium_only)

        this.private = Boolean(data.private)

        this.nsfw = Boolean(data.nsfw)

        this.self_permissions = data.self_permissions || []

        this.user_permissions = data.user_permissions || []

        this.parent.subcommands.set(this.name, this)
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
     * Обработка и выполнение подкоманды
     * 
     * @param {import('../Typings').ServerDocument} server
     * @param {import('discord.js').Message} message
     * @param {String[]} args
     */
    async execute(server, message, args) {
        const locale = this.parent.self.translator.locale(server.locale)

        if (this.premium_only && !server.server.premium.available) {
            await message.channel.send(`${this.parent.self._emojis.ERROR} | ${this.parent.self.translator.format(locale.commands.common.texts.premium_only, `**${message.author.username}**`)}`)

            return false
        }

        const missing = this.hasPermission(message)

        if (missing) {
            if (missing.includes('SEND_MESSAGES')) return false

            await message.channel.send(`${this.self._emojis.ERROR} | ${this.self.translator.format(locale.commands.common.texts.missing_permissions, `**${message.author.username}**`, missing.map(p => `\`${locale.commands.common.permissions[p]}\``).join(', '))}`)

            return false
        }

        await this.fn(this.parent.self, server, message, args)
    }
}

module.exports = Subcommand