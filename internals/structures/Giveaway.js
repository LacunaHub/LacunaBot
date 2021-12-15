const { MessageEmbed, Collection } = require('discord.js')
const { scheduleJob } = require('node-schedule')
const Logger = require('../Logger')

class Giveaway {
    /**
     * @param {import('../Lacuna')} self
     * @param {import('../Typings').Giveaway} data
     */
    constructor(self, data) {
        this.self = self

        this.message_id = data.message_id
        
        this.channel_id = data.channel_id

        this.guild_id = data.guild_id

        this.prize = data.prize

        this.winners_amount = data.winners_amount || 1

        this.members = data.members || []

        this.expiration_date = data.expiration_date

        this.locale = data.locale || 'ru'

        this.schedule = null

        if (Date.now() >= this.expiration_date.getTime() || this.expiration_date.getTime() - Date.now() <= 30000) {
            this.endMessage()
            this.deleteEntry()

            return
        }

        if (data.init) this.create()
        else this.start()
    }

    get _id() {
        return `${this.guild_id}:${this.message_id}`
    }

    get guild() {
        return this.self.guilds.cache.get(this.guild_id)
    }

    get channel() {
        return this.guild.channels.cache.get(this.channel_id)
    }

    async create() {
        await this.start()
        await this.createEntry()
    }

    async createEntry() {
        await this.self.db.servers.update({ _id: this.guild_id }, {
            $push: {
                'utility.giveaways': {
                    message_id: this.message_id,
                    channel_id: this.channel_id,
                    guild_id: this.guild_id,
                    prize: this.prize,
                    winners_amount: this.winners_amount,
                    members: this.members,
                    expiration_date: this.expiration_date.getTime()
                }
            }
        })
    }

    async deleteEntry() {
        await this.self.db.servers.update({ _id: this.guild_id }, {
            $pull: {
                'utility.giveaways': {
                    message_id: this.message_id
                }
            }
        })
    }

    async toSchedule() {
        this.schedule = scheduleJob(this._id, this.expiration_date, () => this.end())
        this.self.giveaways.set(this._id, this)
    }

    async start() {
        await this.toSchedule()
    }

    /**
     * @returns {Promise<import('discord.js').Message>}
     */
    async getMessage() {
        try {
            return await this.channel.messages.fetch(this.message_id)
        } catch (err) {
            return null
        }
    }

    async deleteMessage() {
        const message = await this.getMessage()
        
        if (message && !message.deleted) await message.delete()
    }

    async end(scheduled = true) {
        if (scheduled) await this.endMessage(); else await this.deleteMessage()

        await this.deleteEntry()
        await this.schedule.cancel()
        await this.self.giveaways.delete(this._id)
    }

    async endMessage() {
        const message = await this.getMessage()

        if (!message || message.deleted) {
            await this.end(false); return
        }

        const locale = this.self.translator.locale(this.locale).commands

        if (this.members.length) {
            const members = new Collection()

            for (const member of this.members) members.set(member, this.message_id)

            const winners = members.randomKey(this.winners_amount >= members.size ? members.size : this.winners_amount)

            const embed = new MessageEmbed(message.embeds[0])
                .setDescription(this.self.translator.format(locale.giveaway.end.texts.winners, winners.map(w => `<@${w}>`).join(', ')))
                .setColor(0xF04747)

            await message.edit({ embeds: [embed], components: [] })
            await message.reply({ content: this.self.translator.format(locale.giveaway.end.texts.congrats, `${winners.map(w => `<@${w}>`)}`, `**${this.prize}**`) })

            await members.clear()
        }

        else {
            const embed = new MessageEmbed(message.embeds[0])
                .setDescription(locale.giveaway.end.texts.no_members)
                .setColor(0xF04747)

            await message.edit({ embeds: [embed], components: [] })
        }
    }

    /**
     * @param {import('../Lacuna')} self
     * @param {import('../../internals/Typings').ServerDocument} server
     * @param {import('discord.js').ButtonInteraction} interaction
     */
    static async buttonPressed(self, server, interaction) {
        const [ g, message_id ] = interaction.customId.split('-')
        const giveaway = self.giveaways.find(g => g.message_id == message_id)
        const entry = server.utility.giveaways.find(g => g.message_id == message_id)
        const locale = self.translator.locale(server.locale)

        if (giveaway && entry) {
            if (!entry.members.includes(interaction.user.id)) await self.db.servers.update({ _id: interaction.guild.id, 'utility.giveaways.message_id': message_id }, {
                $push: {
                    'utility.giveaways.$.members': interaction.user.id
                }
            })

            if (!giveaway.members.includes(interaction.user.id)) {
                await giveaway.members.push(interaction.user.id)
            
                const message = await giveaway.getMessage()

                const embed = new MessageEmbed(message.embeds[0])
                embed.fields[2].value = `${giveaway.members.length}`
    
                await message.edit({ embeds: [embed] })

                await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.commands.giveaway.create.texts.participated, `**${interaction.user.username}**`, `**${giveaway.prize}**`)}`, ephemeral: true })
            }

            else {
                await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.commands.giveaway.create.texts.already_participating, `**${interaction.user.username}**`, `**${giveaway.prize}**`)}`, ephemeral: true })
            }
        }
    }

    /**
     * @param {import('../Lacuna')} self
     */
    static async HandleEntries(self) {
        const guilds = self.guilds.cache.map(g => g.id)
        const servers = await self.db.servers.findSome({ _id: { $in: guilds }, 'utility.giveaways.0': { $exists: true } })

        let entries = 0

        if (servers.length) {
            for (const server of servers) {
                const giveaways = server.utility.giveaways

                entries++

                for (const giveaway of giveaways) {
                    new this(self, { message_id: giveaway.message_id, channel_id: giveaway.channel_id, guild_id: server._id, prize: giveaway.prize, winners_amount: giveaway.winners_amount, members: giveaway.members, expiration_date: new Date(giveaway.expiration_date), locale: giveaway.locale })
                }
            }
        }

        await Logger.log(`(Structures): Loaded ${entries} giveaways from ${servers.length} servers`)

        return entries
    }
}

module.exports = Giveaway