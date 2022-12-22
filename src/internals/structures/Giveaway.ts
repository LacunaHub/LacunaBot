import { BaseGuildTextChannel, ButtonInteraction, Collection, EmbedBuilder, Message } from 'discord.js'
import { Job, scheduleJob } from 'node-schedule'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../Lacuna'

export default class Giveaway {
    public self: Lacuna
    public id: string
    public message_id: string
    public channel_id: string
    public guild_id: string
    public prize: string
    public winners_amount: number
    public members: string[]
    public expiration_date: Date
    public expired: boolean
    public locale: string
    public schedule: Job

    constructor(self: Lacuna, options: GiveawayOptions) {
        this.self = self

        this.id = `${options.guild_id}:${options.message_id}`

        this.message_id = options.message_id

        this.channel_id = options.channel_id

        this.guild_id = options.guild_id

        this.prize = options.prize

        this.winners_amount = options.winners_amount || 1

        this.members = options.members || []

        this.expiration_date = options.expiration_date

        this.expired = Date.now() >= this.expiration_date.getTime() || this.expiration_date.getTime() - Date.now() <= 30000

        this.locale = options.locale || 'ru'

        this.schedule = null

        if (this.expired) {
            this.deleteEntry()
            this.deleteMessage()
        } else {
            if (options.initial) {
                this.create()
            } else {
                this.createSchedule()
            }
        }
    }

    get guild() {
        return this.self.guilds.cache.get(this.guild_id)
    }

    get channel() {
        return this.guild.channels.cache.get(this.channel_id)
    }

    async create() {
        await this.createSchedule()
        await this.createEntry()
    }

    async createEntry() {
        await this.self.db.servers.updateOne(
            { _id: this.guild_id },
            {
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
            }
        )
    }

    async createSchedule() {
        this.schedule = scheduleJob(this.id, this.expiration_date, () => this.delete())
        this.self.giveaways.set(this.id, this)
    }

    async delete(scheduled = true) {
        if (scheduled) {
            await this.editMessage()
        } else {
            await this.deleteMessage()
        }

        await this.deleteEntry()
        await this.deleteSchedule()
    }

    async deleteEntry() {
        await this.self.db.servers.updateOne(
            { _id: this.guild_id },
            {
                $pull: {
                    'utility.giveaways': {
                        message_id: this.message_id
                    }
                }
            }
        )
    }

    async deleteSchedule() {
        this.schedule.cancel()
        this.self.giveaways.delete(this.id)
    }

    async getMessage(): Promise<Message> {
        try {
            const messageManager = (this.channel as BaseGuildTextChannel)?.messages

            if (messageManager) return messageManager.fetch({ message: this.message_id })
        } catch (err) {
            return null
        }
    }

    async editMessage() {
        const message = await this.getMessage()

        if (!message) return null

        if (this.members.length) {
            const members: Collection<string, string> = new Collection(this.members.map(m => [m, this.message_id]))
            const winners: string[] = members.randomKey(this.winners_amount >= members.size ? members.size : this.winners_amount)
            const embed = new EmbedBuilder(message.embeds[0])
                .setDescription(this.self.i18n.t(this.locale, 'commands.giveaway.end.text_winners', { winners: winners.map(w => `<@${w}>`).join(', ') }))
                .setColor('#EF5350')

            await message.edit({ embeds: [embed], components: [] })
            await message.reply({
                content: this.self.i18n.t(this.locale, 'commands.giveaway.end.text_congrats', { winner: `${winners.map(w => `<@${w}>`)}`, prize: `**${this.prize}**` })
            })

            members.clear()
        } else {
            const embed = new EmbedBuilder(message.embeds[0]).setDescription(this.self.i18n.t(this.locale, 'commands.giveaway.end.text_no_members')).setColor('#EF5350')

            await message.edit({ embeds: [embed], components: [] })
        }
    }

    async deleteMessage() {
        const message = await this.getMessage()

        if (message) {
            await message.delete()
        }
    }
}

export async function buttonPressed(self: Lacuna, server: ServerDocument, interaction: ButtonInteraction) {
    const [, message_id] = interaction.customId.split('-')
    const giveaway = self.giveaways.find(g => g.message_id == message_id)
    const entry: GiveawayOptions = server.utility.giveaways.find(g => g.message_id == message_id)

    if (giveaway && entry) {
        if (!entry.members.includes(interaction.user.id))
            await self.db.servers.updateOne(
                { _id: interaction.guild.id, 'utility.giveaways.message_id': message_id },
                {
                    $push: {
                        'utility.giveaways.$.members': interaction.user.id
                    }
                }
            )

        if (!giveaway.members.includes(interaction.user.id)) {
            await giveaway.members.push(interaction.user.id)

            const message = await giveaway.getMessage()

            const embed = new EmbedBuilder(message.embeds[0])
            embed.data.fields[2].value = `${giveaway.members.length}`

            await message.edit({ embeds: [embed] })

            await interaction.reply({
                content: `${self._emojis.OK} | ${self.i18n.t(server.locale, 'commands.giveaway.create.text_participated', {
                    user: `**${interaction.user.username}**`,
                    giveaway: `**${giveaway.prize}**`
                })}`,
                ephemeral: true
            })
        } else {
            await interaction.reply({
                content: `${self._emojis.ERROR} | ${self.i18n.t(server.locale, 'commands.giveaway.create.text_already_participating', {
                    user: `**${interaction.user.username}**`,
                    giveaway: `**${giveaway.prize}**`
                })}`,
                ephemeral: true
            })
        }
    }
}

export async function handleEntries(self: Lacuna): Promise<number> {
    const guilds: string[] = self.guilds.cache.map(g => g.id)
    const servers: ServerDocument[] = await self.db.servers.find({ _id: { $in: guilds }, 'utility.giveaways.0': { $exists: true } })

    let entries = 0

    for (const server of servers) {
        const giveaways: GiveawayOptions[] = server.utility.giveaways

        for (const giveaway of giveaways) {
            new Giveaway(self, {
                message_id: giveaway.message_id,
                channel_id: giveaway.channel_id,
                guild_id: server._id,
                prize: giveaway.prize,
                winners_amount: giveaway.winners_amount,
                members: giveaway.members,
                expiration_date: new Date(giveaway.expiration_date),
                locale: giveaway.locale
            })
        }

        entries += giveaways.length
    }

    self.logger.log(`(Structures): Loaded ${entries} giveaways from ${servers.length} servers`)

    return entries
}

export interface GiveawayOptions {
    message_id: string
    channel_id: string
    guild_id: string
    prize: string
    winners_amount: number
    members?: string[]
    expiration_date: Date
    locale: string
    initial?: boolean
}
