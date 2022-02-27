import { BaseGuildTextChannel, BaseGuildVoiceChannel, Collection, Guild, GuildMember, Message, VoiceState } from 'discord.js'
import { EconomyStoreItem, ServerDocument } from '../database/schemas/Servers'
import Lacuna from '../internals/Lacuna'
import db from '../database'
import TemporaryRole from '../internals/structures/TemporaryRole'

export async function messageCreate(self: Lacuna, server: ServerDocument, message: Message) {
    if (!server.modules.economy.active || !server.modules.economy.currencies.length) return false

    const activities = await self.db.activities.fetch({ _id: message.guildId })
    let wallet = activities.wallets.find(w => w.user_id == message.author.id)

    if (!wallet) {
        const data = wallet = {
            user_id: message.author.id,
            currencies: [],
            transactions: [],
            activity: {
                last_message_at: 0,
                voice_connected_at: 0
            }
        }

        await self.db.activities.updateOne({ _id: message.guildId }, {
            $push: { wallets: data as never }
        })
    }

    for (const currency of server.modules.economy.currencies) {
        if (currency.income.allowed.channels.length && !currency.income.allowed.channels.includes(message.channelId)) continue
        if (currency.income.allowed.roles.length && !message.member.roles.cache.some(r => currency.income.allowed.roles.includes(r.id))) continue
        if (currency.income.blocked.channels.includes(message.channelId)) continue
        if (message.member.roles.cache.some(r => currency.income.blocked.roles.includes(r.id))) continue

        if (currency.income.messages.rate_limit_per_user && (Date.now() - wallet.activity.last_message_at) < (currency.income.messages.rate_limit_per_user * 1000)) continue

        const amount: number = Math.random() * (currency.income.messages.range_per_message[1] - currency.income.messages.range_per_message[0]) + currency.income.messages.range_per_message[0]
        
        if (wallet.currencies.some(c => c.id == currency.id)) {
            await self.db.activities.updateOne({ _id: message.guildId, wallets: { $elemMatch: { user_id: message.author.id, 'currencies.id': currency.id } } }, {
                $inc: {
                    'wallets.$[user].currencies.$[currency].amount': amount
                },
                $set: {
                    'wallets.$[user].activity.last_message_at': Date.now()
                }
            }, { arrayFilters: [ { 'user.user_id': message.author.id }, { 'currency.id': currency.id } ] })
        }

        else {
            await self.db.activities.updateOne({ _id: message.guildId, 'wallets.user_id': message.author.id }, {
                $push: {
                    'wallets.$.currencies': {
                        id: currency.id, amount
                    }
                },
                $set: {
                    'wallets.$.activity.last_message_at': Date.now()
                }
            })
        }
    }
}

export async function voiceAssign(self: Lacuna, server: ServerDocument, state: VoiceState) {
    if (!server.modules.economy.active || !server.modules.economy.currencies.length || !server.server.premium.available) return false

    const members = state.channel.members.filter(m => !m.user.bot && !m.voice.serverMute && !m.voice.serverDeaf)

    if (members.size > 1) {
        for (const [, member] of members) {
            const activities = await self.db.activities.fetch({ _id: state.guild.id })
            let wallet = activities.wallets.find(w => w.user_id == member.id)
        
            if (!wallet) {
                const data = wallet = {
                    user_id: member.id,
                    currencies: [],
                    transactions: [],
                    activity: {
                        last_message_at: 0,
                        voice_connected_at: 0
                    }
                }
        
                await self.db.activities.updateOne({ _id: state.guild.id }, {
                    $push: { wallets: data as never }
                })
            }

            if (!wallet.activity.voice_connected_at) {
                await self.db.activities.updateOne({ _id: state.guild.id, 'wallets.user_id': member.id }, {
                    $set: {
                        'wallets.$.activity.voice_connected_at': Date.now()
                    }
                })
            }
        }

        self.emit('moduleExecution', { module: 'Economy: Voice Assign', guild: { id: state.guild.id, name: state.guild.name }, target: { id: state.id, name: state.member.user.tag } })
    }
}

export async function voiceUnassign(self: Lacuna, server: ServerDocument, state: VoiceState, channel: BaseGuildVoiceChannel) {
    if (!server.modules.economy.active || !server.modules.economy.currencies.length || !server.server.premium.available) return false

    const members = channel?.members?.filter(m => !m.user.bot && !m.voice.serverMute && !m.voice.serverDeaf)

    if (members) await voiceCount(self, server, (members.size == 1 ? [ state.member, members.first() ] : [ state.member ]), channel)
}

export async function voiceCount(self: Lacuna, server: ServerDocument, members: GuildMember[], channel: BaseGuildVoiceChannel) {
    for (const member of members) {
        const activities = await self.db.activities.fetch({ _id: server._id })
        const wallet = activities.wallets.find(w => w.user_id == member.id)

        if (!wallet || !wallet.activity.voice_connected_at) continue

        const time: number = (Date.now() - wallet.activity.voice_connected_at) / 60000

        for (const currency of server.modules.economy.currencies) {
            if (currency.income.allowed.channels.length && !currency.income.allowed.channels.includes(channel.id)) continue
            if (currency.income.allowed.roles.length && !member.roles.cache.some(r => currency.income.allowed.roles.includes(r.id))) continue
            if (currency.income.blocked.channels.includes(channel.id)) continue
            if (member.roles.cache.some(r => currency.income.blocked.roles.includes(r.id))) continue

            const amount: number = (Math.random() * (currency.income.voice_channels.range_per_minute[1] - currency.income.voice_channels.range_per_minute[0]) + currency.income.voice_channels.range_per_minute[0]) * time

            if (wallet.currencies.some(c => c.id == currency.id)) {
                await self.db.activities.updateOne({ _id: server._id, wallets: { $elemMatch: { user_id: member.id, 'currencies.id': currency.id } } }, {
                    $inc: {
                        'wallets.$[user].currencies.$[currency].amount': amount
                    },
                    $set: {
                        'wallets.$[user].activity.voice_connected_at': 0
                    }
                }, { arrayFilters: [ { 'user.user_id': member.id }, { 'currency.id': currency.id } ] })
            }
    
            else {
                await self.db.activities.updateOne({ _id: server._id, 'wallets.user_id': member.id }, {
                    $push: {
                        'wallets.$.currencies': {
                            id: currency.id, amount
                        }
                    },
                    $set: {
                        'wallets.$.activity.voice_connected_at': 0
                    }
                })
            }
        }

        self.emit('moduleExecution', { module: 'Economy: Voice Unassign', guild: { id: member.guild.id, name: member.guild.name }, target: { id: member.id, name: member.user.tag } })
    }
}

export async function purchaseItem(item: EconomyStoreItem, self: Lacuna, guild: Guild, member: GuildMember) {
    const activities = await db.activities.findOne({ _id: guild.id })
    let wallet = activities.wallets.find(w => w.user_id == member.id)

    if (!wallet) {
        const data = wallet = {
            user_id: member.id,
            currencies: [],
            transactions: [],
            activity: {
                last_message_at: 0,
                voice_connected_at: 0
            }
        }

        await db.activities.updateOne({ _id: guild.id }, {
            $push: { wallets: data as never }
        })
    }

    const measures = { MINUTES: 60, HOURS: 3600, DAYS: 86400 }

    if (!wallet.currencies.find(c => c.id == item.currency_id) || wallet.currencies.find(c => c.id == item.currency_id).amount < item.purchase_price) return 'INSUFFICIENT_FUNDS'

    if (wallet.transactions.some(t => t.type == 'PURCHASE' && t.details == `${item.id}:${item.references.join(',')}`)) {
        if (item.options.includes('TEMPORARY_REFERENCES')) {
            const transaction = wallet.transactions.find(t => t.type == 'PURCHASE' && t.details == `${item.id}:${item.references.join(',')}`)

            const not_yet = (Date.now() - transaction.timestamp) / 1000 < item.references_duration.value * measures[item.references_duration.measure]

            if (not_yet) return 'PURCHASED'
        }

        else return 'PURCHASED'
    }

    if (item.type == 'CHANNEL') {
        const channels = guild.channels.cache.filter(c => c.manageable && item.references.includes(c.id)) as Collection<string, BaseGuildTextChannel>

        if (channels.size) {
            for (const [, channel] of channels) await channel.permissionOverwrites.create(member.id, { VIEW_CHANNEL: true }).catch(() => {})
        }
    }

    if (item.type == 'ROLE') {
        const roles = guild.roles.cache.filter(r => r.editable && item.references.includes(r.id))

        if (roles.size) {
            if (item.options.includes('TEMPORARY_REFERENCES')) {
                for (const reference of item.references) {
                    new TemporaryRole(self, {
                        user_id: member.id,
                        guild_id: guild.id,
                        role_id: reference,
                        expires_timestamp: Date.now() + ((item.references_duration.value * measures[item.references_duration.measure]) * 1000),
                        initial: true
                    })
                }
            }

            else await member.roles.add(roles).catch(() => {})
        }
    }

    await db.activities.updateOne({ _id: guild.id, wallets: { $elemMatch: { user_id: member.id, 'currencies.id': item.currency_id } } }, {
        $inc: {
            'wallets.$[user].currencies.$[currency].amount': -item.purchase_price
        },
        $push: {
            'wallets.$[user].transactions': {
                $each: [
                    {
                        type: 'PURCHASE',
                        amount: item.purchase_price,
                        details: `${item.id}:${item.references.join(',')}`,
                        timestamp: Date.now()
                    }
                ],
                $position: 0,
                $slice: 512
            }
        }
    }, { arrayFilters: [ { 'user.user_id': member.id }, { 'currency.id': item.currency_id } ] })

    if (item.options.includes('LIMITED_QUANTITY')) await db.servers.updateOne({ _id: guild.id, 'modules.economy.store.items.id': item.id }, {
        $inc: {
            'modules.economy.store.items.$.quantity': -1
        }
    })

    return 'SUCCESS'
}