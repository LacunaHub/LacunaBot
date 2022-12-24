import { BaseGuildTextChannel, BaseGuildVoiceChannel, Collection, Guild, GuildMember, Message, VoiceState } from 'discord.js'
import { EconomyStoreItem, ServerDocument } from '../database/schemas/Servers'
import Lacuna from '../internals/Lacuna'
import TemporaryRole from '../internals/structures/TemporaryRole'

export async function messageCreate(self: Lacuna, server: ServerDocument, message: Message) {
    if (!server.modules.economy.active || !server.modules.economy.currencies.length) return false

    let user = await self.db.users.findOne({ _id: message.author.id })

    if (!user) {
        user = await self.db.users.create({
            _id: message.author.id,
            user: {
                username: message.author.username,
                discriminator: message.author.discriminator,
                avatar: message.author.avatar,
                flags: message.author.flags?.bitfield ?? 0
            }
        } as any)
    }

    let wallet = user.activities.wallets.find(i => i.guild_id == message.guildId)

    if (!wallet) {
        wallet = {
            guild_id: message.guildId,
            currencies: [],
            transactions: [],
            activity: {
                last_message_at: 0,
                voice_connected_at: 0
            }
        }

        await self.db.users.updateOne(
            { _id: message.author.id },
            {
                $push: { 'activities.wallets': wallet as never }
            }
        )
    }

    for (const currency of server.modules.economy.currencies) {
        if (currency.income.allowed.channels.length && !currency.income.allowed.channels.includes(message.channelId)) continue
        if (currency.income.allowed.roles.length && !message.member.roles.cache.some(r => currency.income.allowed.roles.includes(r.id))) continue
        if (currency.income.blocked.channels.includes(message.channelId)) continue
        if (message.member.roles.cache.some(r => currency.income.blocked.roles.includes(r.id))) continue

        if (
            currency.income.messages.rate_limit_per_user &&
            Date.now() - wallet.activity.last_message_at < currency.income.messages.rate_limit_per_user * 1000
        )
            continue

        const multipliers = server.modules.activities.multipliers
            .filter(i => {
                if (i.blocked_channels.includes(message.channelId)) return false
                if (message.member.roles.cache.some(ii => i.blocked_roles.includes(ii.id))) return false
                if (i.allowed_channels.length && !i.allowed_channels.includes(message.channelId)) return false
                if (i.allowed_roles.length && !message.member.roles.cache.some(ii => i.allowed_roles.includes(ii.id))) return false

                return i.options.includes('ECONOMY_TEXT')
            })
            .slice(0, server.server.premium.available ? 10 : 1)

        const multiplier = multipliers.reduce((x, y) => x * (y.economy_text_multiplier / 100), 100) / 100
        let amount: number =
            Math.random() * (currency.income.messages.range_per_message[1] - currency.income.messages.range_per_message[0]) +
            currency.income.messages.range_per_message[0]

        amount *= multiplier || 1

        if (wallet.currencies.some(c => c.id == currency.id)) {
            await self.db.users.updateOne(
                { _id: message.author.id, 'activities.wallets': { $elemMatch: { guild_id: message.guildId, 'currencies.id': currency.id } } },
                {
                    $inc: {
                        'activities.wallets.$[guild].currencies.$[currency].amount': amount
                    },
                    $set: {
                        'activities.wallets.$[guild].activity.last_message_at': Date.now()
                    }
                },
                { arrayFilters: [{ 'guild.guild_id': message.guildId }, { 'currency.id': currency.id }] }
            )
        } else {
            await self.db.users.updateOne(
                { _id: message.author.id, 'activities.wallets.guild_id': message.guildId },
                {
                    $push: {
                        'activities.wallets.$.currencies': { id: currency.id, amount }
                    },
                    $set: {
                        'activities.wallets.$.activity.last_message_at': Date.now()
                    }
                }
            )
        }
    }

    self.emit('moduleExecution', {
        module: 'Economy',
        category: 'MessageCreate',
        guild: { id: message.guild.id, name: message.guild.name },
        target: { id: message.author.id, name: message.author.tag }
    })

    return true
}

export async function voiceAssign(self: Lacuna, server: ServerDocument, state: VoiceState) {
    if (!server.modules.economy.active || !server.modules.economy.currencies.length || !server.server.premium.available) return false

    const members = state.channel.members.filter(m => !m.user.bot && !m.voice.serverMute && !m.voice.serverDeaf)

    if (members.size > 1) {
        for (const [, member] of members) {
            let user = await self.db.users.findOne({ _id: member.id })

            if (!user) {
                user = await self.db.users.create({
                    _id: member.id,
                    user: {
                        username: member.user.username,
                        discriminator: member.user.discriminator,
                        avatar: member.avatar,
                        flags: member.user.flags?.bitfield ?? 0
                    }
                } as any)
            }

            let wallet = user.activities.wallets.find(i => i.guild_id == member.guild.id)

            if (!wallet) {
                wallet = {
                    guild_id: member.guild.id,
                    currencies: [],
                    transactions: [],
                    activity: {
                        last_message_at: 0,
                        voice_connected_at: 0
                    }
                }

                await self.db.users.updateOne(
                    { _id: member.id },
                    {
                        $push: { 'activities.wallets': wallet as never }
                    }
                )
            }

            if (!wallet.activity.voice_connected_at || Date.now() - wallet.activity.voice_connected_at > 36_000_000) {
                await self.db.users.updateOne(
                    { _id: member.id, 'activities.wallets.guild_id': member.guild.id },
                    {
                        $set: {
                            'activities.wallets.$.activity.voice_connected_at': Date.now()
                        }
                    }
                )
            }
        }

        self.emit('moduleExecution', {
            module: 'Economy',
            category: 'VoiceAssign',
            guild: { id: state.guild.id, name: state.guild.name },
            target: { id: state.id, name: state.member.user.tag }
        })

        return true
    }

    return false
}

export async function voiceUnassign(self: Lacuna, server: ServerDocument, state: VoiceState, channel: BaseGuildVoiceChannel) {
    if (!server.modules.economy.active || !server.modules.economy.currencies.length || !server.server.premium.available) return false

    const members = channel?.members?.filter(m => !m.user.bot && !m.voice.serverMute && !m.voice.serverDeaf)

    if (members) await voiceCount(self, server, members.size == 1 ? [state.member, members.first()] : [state.member], channel)
}

export async function voiceCount(self: Lacuna, server: ServerDocument, members: GuildMember[], channel: BaseGuildVoiceChannel) {
    for (const member of members) {
        const user = await self.db.users.findOne({ _id: member.user.id })
        const wallet = user?.activities?.wallets?.find(i => i.guild_id == server._id)

        if (!wallet?.activity?.voice_connected_at) continue

        const time: number = (Date.now() - wallet.activity.voice_connected_at) / 60000

        for (const currency of server.modules.economy.currencies) {
            if (currency.income.allowed.channels.length && !currency.income.allowed.channels.includes(channel.id)) continue
            if (currency.income.allowed.roles.length && !member.roles.cache.some(r => currency.income.allowed.roles.includes(r.id))) continue
            if (currency.income.blocked.channels.includes(channel.id)) continue
            if (member.roles.cache.some(r => currency.income.blocked.roles.includes(r.id))) continue

            const multipliers = server.modules.activities.multipliers
                .filter(i => {
                    if (i.blocked_channels.includes(channel.id)) return false
                    if (member.roles.cache.some(ii => i.blocked_roles.includes(ii.id))) return false
                    if (i.allowed_channels.length && !i.allowed_channels.includes(channel.id)) return false
                    if (i.allowed_roles.length && !member.roles.cache.some(ii => i.allowed_roles.includes(ii.id))) return false

                    return i.options.includes('ECONOMY_VOICE')
                })
                .slice(0, server.server.premium.available ? 10 : 1)

            const multiplier = multipliers.reduce((x, y) => x * (y.economy_voice_multiplier / 100), 100) / 100
            let amount: number =
                (Math.random() * (currency.income.voice_channels.range_per_minute[1] - currency.income.voice_channels.range_per_minute[0]) +
                    currency.income.voice_channels.range_per_minute[0]) *
                time

            amount *= multiplier || 1

            if (wallet.currencies.some(c => c.id == currency.id)) {
                await self.db.users.updateOne(
                    { _id: member.user.id, 'activities.wallets': { $elemMatch: { guild_id: server._id, 'currencies.id': currency.id } } },
                    {
                        $inc: {
                            'activities.wallets.$[guild].currencies.$[currency].amount': amount
                        },
                        $set: {
                            'activities.wallets.$[guild].activity.voice_connected_at': 0
                        }
                    },
                    { arrayFilters: [{ 'guild.guild_id': server._id }, { 'currency.id': currency.id }] }
                )
            } else {
                await self.db.users.updateOne(
                    { _id: member.user.id, 'activities.wallets.guild_id': server._id },
                    {
                        $push: {
                            'activities.wallets.$.currencies': { id: currency.id, amount }
                        },
                        $set: {
                            'activities.wallets.$.activity.voice_connected_at': 0
                        }
                    }
                )
            }
        }

        self.emit('moduleExecution', {
            module: 'Economy',
            category: 'VoiceUnassign',
            guild: { id: member.guild.id, name: member.guild.name },
            target: { id: member.id, name: member.user.tag }
        })
    }
}

export async function purchaseItem(item: EconomyStoreItem, self: Lacuna, guild: Guild, member: GuildMember) {
    let user = await self.db.users.findOne({ _id: member.id })

    if (!user) {
        user = await self.db.users.create({
            _id: guild.id,
            user: {
                username: member.user.username,
                discriminator: member.user.discriminator,
                avatar: member.user.avatar,
                flags: member.user.flags?.bitfield ?? 0
            }
        } as any)
    }

    let wallet = user.activities.wallets.find(i => i.guild_id == guild.id)

    if (!wallet) {
        wallet = {
            guild_id: guild.id,
            currencies: [],
            transactions: [],
            activity: {
                last_message_at: 0,
                voice_connected_at: 0
            }
        }

        await self.db.users.updateOne(
            { _id: member.id },
            {
                $push: { 'activities.wallets': wallet as never }
            }
        )
    }

    const measures = { MINUTES: 60, HOURS: 3600, DAYS: 86400 }

    if (!wallet.currencies.find(c => c.id == item.currency_id) || wallet.currencies.find(c => c.id == item.currency_id).amount < item.purchase_price)
        return 'INSUFFICIENT_FUNDS'

    if (wallet.transactions.some(t => t.type == 'PURCHASE' && t.details == `${item.id}:${item.references.join(',')}`)) {
        if (item.options.includes('TEMPORARY_REFERENCES')) {
            const transaction = wallet.transactions.find(t => t.type == 'PURCHASE' && t.details == `${item.id}:${item.references.join(',')}`)

            const not_yet = (Date.now() - transaction.timestamp) / 1000 < item.references_duration.value * measures[item.references_duration.measure]

            if (not_yet) return 'PURCHASED'
        } else return 'PURCHASED'
    }

    if (item.type == 'CHANNEL') {
        const channels = guild.channels.cache.filter(c => c.manageable && item.references.includes(c.id)) as Collection<string, BaseGuildTextChannel>

        if (channels.size) {
            for (const [, channel] of channels) await channel.permissionOverwrites.create(member.id, { ViewChannel: true }).catch(() => {})
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
                        expires_timestamp: Date.now() + item.references_duration.value * measures[item.references_duration.measure] * 1000,
                        initial: true
                    })
                }
            } else await member.roles.add(roles).catch(() => {})
        }
    }

    await self.db.users.updateOne(
        { _id: member.id, 'activities.wallets': { $elemMatch: { guild_id: guild.id, 'currencies.id': item.currency_id } } },
        {
            $inc: {
                'activities.wallets.$[guild].currencies.$[currency].amount': -item.purchase_price
            },
            $push: {
                'activities.wallets.$[guild].transactions': {
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
        },
        { arrayFilters: [{ 'guild.guild_id': guild.id }, { 'currency.id': item.currency_id }] }
    )

    if (item.options.includes('LIMITED_QUANTITY'))
        await self.db.servers.updateOne(
            { _id: guild.id, 'modules.economy.store.items.id': item.id },
            {
                $inc: {
                    'modules.economy.store.items.$.quantity': -1
                }
            }
        )

    self.emit('moduleExecution', {
        module: 'Economy',
        category: 'ItemPurchase',
        guild: { id: guild.id, name: guild.name },
        target: { id: item.id, name: item.name }
    })

    return 'SUCCESS'
}
