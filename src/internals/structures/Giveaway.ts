import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { BaseGuildTextChannel, ButtonInteraction, Collection, EmbedBuilder } from 'discord.js'
import { Job, scheduleJob } from 'node-schedule'
import Lacuna from '../Lacuna'

export default class Giveaway {
    public self: Lacuna
    public messageId: string
    public channelId: string
    public guildId: string
    public prize: string
    public numberOfWinners: number
    public participants: Collection<string, string>
    public expiresAt: Date
    public locale: string
    public schedule: Job

    constructor(self: Lacuna, options: GiveawayOptions) {
        this.self = self

        this.messageId = options.message_id

        this.channelId = options.channel_id

        this.guildId = options.guild_id

        this.prize = options.prize

        this.numberOfWinners = options.number_of_winners

        this.participants = new Collection((options.participants || []).map(i => [i, i]))

        this.expiresAt = new Date(options.expires_at)

        this.locale = options.locale

        this.schedule = null

        const expired = Date.now() > this.expiresAt.getTime() || this.expiresAt.getTime() - Date.now() < 50000

        if (expired) {
            this.delete()
        } else {
            this.create(Boolean(options.initial))
        }
    }

    async create(initial: boolean = false) {
        this.schedule = scheduleJob(this.messageId, this.expiresAt, () => this.delete())
        this.self.giveaways.set(this.messageId, this)

        if (initial) {
            await this.self.db.servers.updateOne(
                { _id: this.guildId },
                {
                    $push: {
                        'utility.giveaways': {
                            $each: [
                                {
                                    message_id: this.messageId,
                                    channel_id: this.channelId,
                                    guild_id: this.guildId,
                                    prize: this.prize,
                                    expires_at: this.expiresAt.getTime(),
                                    number_of_winners: this.numberOfWinners,
                                    participants: []
                                }
                            ],
                            $slice: -20
                        }
                    }
                }
            )
        }
    }

    async delete(scheduled: boolean = true) {
        if (!scheduled) this.schedule.cancel()

        await this.updateMessage()
        this.self.giveaways.delete(this.messageId)
    }

    async getMessage() {
        try {
            const guild = this.self.guilds.cache.get(this.guildId)
            const channel = guild?.channels?.cache?.get(this.channelId) as BaseGuildTextChannel

            if (guild && channel?.messages) {
                return await channel.messages.fetch({ message: this.messageId })
            }
        } catch (err) {
            await this.self.logger.handleError({ module: 'Giveaways', action: 'FetchGiveawayMessage', error: err, guild_id: this.guildId })

            await this.self.db.servers.updateOne(
                { _id: this.guildId },
                {
                    $pull: {
                        'utility.giveaways': {
                            message_id: this.messageId
                        }
                    }
                }
            )

            return null
        }
    }

    async updateMessage() {
        const message = await this.getMessage()

        if (!message) return false

        const t = this.self.i18n.t.bind(null, this.locale)
        const embed = new EmbedBuilder(message.embeds[0].toJSON()).setColor('#EF5350')

        if (this.participants.size) {
            const winners = this.participants.randomKey(this.numberOfWinners > this.participants.size ? this.participants.size : this.numberOfWinners)

            embed.setDescription(
                t('Commands.GiveawayCommand.SubCommands.EndCommand.Texts.GiveawayWinners', { winners: winners.map(w => `<@${w}>`).join(', ') })
            )

            try {
                await message.reply({
                    content: t('Commands.GiveawayCommand.SubCommands.EndCommand.Texts.CongratulationsYouHaveWon', {
                        winner: `${winners.map(w => `<@${w}>`)}`,
                        prize: `**${this.prize}**`
                    })
                })
            } catch (err) {
                await this.self.logger.handleError({ module: 'Giveaways', action: 'SendCongrats', error: err, guild_id: this.guildId })
            }
        } else {
            embed.setDescription(t('Commands.GiveawayCommand.SubCommands.EndCommand.Texts.NoGiveawayParticipants'))
        }

        try {
            await message.edit({ embeds: [embed], components: [] })
        } catch (err) {
            await this.self.logger.handleError({ module: 'Giveaways', action: 'UpdateGiveawayMessage', error: err, guild_id: this.guildId })
        }

        return true
    }
}

export async function onPressGiveawayButton(self: Lacuna, server: ServerDocument, interaction: ButtonInteraction) {
    const [, messageId] = interaction.customId.split('-')
    const giveaway = self.giveaways.get(messageId)

    if (giveaway && Date.now() < giveaway.expiresAt.getTime()) {
        const t = self.i18n.t.bind(null, server.locale)

        if (giveaway.participants.has(interaction.user.id)) {
            await interaction.reply({
                content: `${self.staticEmojis.Cross} | ${t('Commands.GiveawayCommand.SubCommands.CreateCommand.Texts.YouAreAlreadyInGiveaway', {
                    username: `**${interaction.user.username}**`,
                    giveaway: `**${giveaway.prize}**`
                })}`,
                ephemeral: true
            })
        } else {
            giveaway.participants.set(interaction.user.id, interaction.user.id)
            await self.db.servers.updateOne(
                { _id: interaction.guild.id, 'utility.giveaways.message_id': messageId },
                {
                    $push: {
                        'utility.giveaways.$.participants': interaction.user.id
                    }
                }
            )

            const message = await giveaway.getMessage(),
                rows = message.components
            rows[0].components[0].data['emoji'] = { name: '🎉' }
            rows[0].components[0].data['label'] = giveaway.participants.size.toString()

            await message.edit({ components: rows })
            await interaction.reply({
                content: `${self.staticEmojis.Check} | ${t('Commands.GiveawayCommand.SubCommands.CreateCommand.Texts.YouHaveParticipatedInGiveaway', {
                    username: `**${interaction.user.username}**`,
                    giveaway: `**${giveaway.prize}**`
                })}`,
                ephemeral: true
            })
        }
    }
}

export async function handleEntries(self: Lacuna) {
    const guildIds = self.guilds.cache.map(i => i.id)
    const servers = await self.db.servers.find({ _id: { $in: guildIds }, 'utility.giveaways.0': { $exists: true } })
    let handledEntries = 0

    for (const server of servers) {
        const giveaways = server.utility.giveaways.filter(i => Date.now() < i.expires_at)

        for (const giveaway of giveaways) {
            new Giveaway(self, {
                ...giveaway,
                expires_at: giveaway.expires_at,
                number_of_winners: giveaway.number_of_winners,
                participants: giveaway.participants,
                locale: server.locale
            })
        }

        handledEntries += giveaways.length
    }

    self.logger.log(`[Giveaway] Loaded ${handledEntries} giveaways from ${servers.length} servers`)

    return handledEntries
}

export interface GiveawayOptions {
    message_id: string
    channel_id: string
    guild_id: string
    prize: string
    expires_at: number
    number_of_winners: number
    participants: string[]
    locale: string
    initial?: boolean
}
