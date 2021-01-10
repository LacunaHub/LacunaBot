const { MessageEmbed } = require('discord.js')
const { TruncateString } = require('../internals/utility/Utils')

class Report {
    /**
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Message} message
     */
    constructor(self, server, message) {
        this.self = self

        this.server = server

        this.message = message
    }

    /**
     * @type {import('discord.js').TextChannel}
     */
    get channel() {
        return this.message.guild.channels.cache.get(this.server.modules.reports.channel_id)
    }

    get emoji() {
        return this.server.modules.reports.emoji.id ? `<${this.server.modules.reports.emoji.animated ? 'a:' : ':'}${this.server.modules.reports.emoji.name}:${this.server.modules.reports.emoji.id}>` : this.server.modules.reports.emoji.name
    }

    async exists() {
        const messages = await this.channel.messages.fetch({ limit: 50 }, false)
        const message = messages.find(m => m.author.id == this.self.user.id && m.embeds[0] && m.embeds[0].footer && m.embeds[0].footer.text.startsWith(`ID: ${this.message.id}`))

        return message ? true : false
    }

    correct(number) {
        return number >= this.server.modules.reports.minimum
    }

    async create(reporters) {
        const locale = this.self.translator.locale(this.server.locale).commands

        const embed = new MessageEmbed()
            .setAuthor(this.message.author.tag, this.message.author.displayAvatarURL())
            .addField('\u200B', '\u200B', true)
            .setFooter(`ID: ${this.message.id}`)
            .setTimestamp(this.message.createdTimestamp)

        if (this.message.attachments.filter(file => file.width).size > 0) embed.setImage(this.message.attachments.first().proxyURL)
        if (this.message.content) embed.setDescription(`${TruncateString(this.message.content, 768)}${this.message.embeds[0] ? `\n\`[${locale.embed_message}]\`` : ''}`)

        try {
            return await this.channel.send(`${this.emoji} **${reporters}** | <#${this.message.channel.id}>`, embed)
        } catch (err) {
            
        }
    }

    async edit(reporters) {
        const messages = await this.channel.messages.fetch({ limit: 50 }, false)
        const filter = messages.find(m => m.author.id == this.message.client.user.id && m.embeds[0] && m.embeds[0].footer && m.embeds[0].footer.text.startsWith(`ID: ${this.message.id}`))
        
        if (!filter) return null

        try {
            const message = await this.channel.messages.fetch(filter.id, false)

            if (message) return await message.edit(`${this.emoji} **${reporters}** | <#${this.message.channel.id}>`)

            return null
        } catch (err) {
            return null
        }
    }

    async delete() {
        const messages = await this.channel.messages.fetch({ limit: 50 }, false)
        const filter = messages.find(m => m.author.id == this.message.client.user.id && m.embeds[0] && m.embeds[0].footer && m.embeds[0].footer.text.startsWith(`ID: ${this.message.id}`))
        
        if (!filter) return null

        try {
            const message = await this.channel.messages.fetch(filter.id, false)

            if (message) return await message.delete()

            return null
        } catch (err) {
            return null
        }
    }

    /**
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').MessageReaction} reaction
     */
    static async ReactionAdd(self, server, reaction) {
        if (server.modules.reports.active) {
            const message = reaction.message
            const message_reaction = message.reactions.cache.get(server.modules.reports.emoji.id || server.modules.reports.emoji.name), reporters = message_reaction ? message_reaction.count : 0
            
            if (message_reaction) {
                const report = new this(self, server, message)

                const exists = await report.exists()
                const correct = report.correct(reporters)

                if (exists) {
                    await report.edit(reporters)
                }

                else if (!exists && correct) {
                    await report.create(reporters)

                    await self.emit('moduleExecution', { module: 'Reports: Create', guild: { id: message.guild.id, name: message.guild.name }, target: { id: message.author.id, name: message.author.tag } })
                }
            }
        }
    }

    /**
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').MessageReaction} reaction
     */
    static async ReactionRemove(self, server, reaction) {
        if (server.modules.reports.active) {
            const message = reaction.message
            const message_reaction = message.reactions.cache.get(server.modules.reports.emoji.id || server.modules.reports.emoji.name), reporters = message_reaction ? message_reaction.count : 0
            
            if (message_reaction) {
                const report = new this(self, server, message)

                const exists = await report.exists()
                const correct = report.correct(reporters)

                if (exists && correct) {
                    await report.edit(reporters)
                }

                else {
                    await report.delete(reporters)

                    await self.emit('moduleExecution', { module: 'Reports: Delete', guild: { id: message.guild.id, name: message.guild.name }, target: { id: message.author.id, name: message.author.tag } })
                }
            }
        }
    }
}

module.exports = Report