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

        this.parent.subcommands.set(this.name, this)
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

        await this.fn(this.parent.self, server, message, args)
    }
}

module.exports = Subcommand