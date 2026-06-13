import { ServerDocument, ServerModulesEconomyStoreItem } from '@/database/schemas/Servers'
import { BaseGuildTextChannel, BaseGuildVoiceChannel, Collection, Guild, GuildMember, Message, VoiceState } from 'discord.js'
import Lacuna from '../internals/Lacuna'
import TemporaryRole from '../internals/structures/TemporaryRole'
import { hasRestrictedPermissions } from './Levels'

export async function messageCreate(self: Lacuna, server: ServerDocument, message: Message) {
    if (!server.modules.economy.active || !server.modules.economy.currencies.length) return false

    const user = await self.db.users.fetch(
        { _id: message.author.id },
        {
            user: {
                username: message.author.username,
                avatar: message.author.avatar,
                flags: message.author.flags?.bitfield ?? 0,
                global_name: message.author.globalName
            }
        }
    )
    const userWallet = await self.db.users.fetchWallet(user, message.guildId)
    await self.db.users.fetchServerProfile(user, server._id, {
        accent_color: message.member.displayColor,
        avatar: message.member.avatar,
        banner: null,
        nickname: message.member.nickname
    })

    for (const currency of server.modules.economy.currencies) {
        const hasRestrictions = hasRestrictedPermissions({
            channel: message.channel as any,
            roles: message.member.roles.cache,
            allowedChannels: currency.income.allowed.channels,
            allowedRoles: currency.income.allowed.roles,
            blockedChannels: currency.income.blocked.channels,
            blockedRoles: currency.income.blocked.roles
        })

        if (hasRestrictions) continue

        if (
            currency.income.messages.rate_limit_per_user &&
            Date.now() - userWallet.activity.last_message_at < currency.income.messages.rate_limit_per_user * 1000
        )
            continue

        const multipliers = server.modules.activities.multipliers
            .filter(i => {
                const hasRestrictions = hasRestrictedPermissions({
                    channel: message.channel as any,
                    roles: message.member.roles.cache,
                    allowedChannels: i.allowed_channels,
                    allowedRoles: i.allowed_roles,
                    blockedChannels: i.blocked_channels,
                    blockedRoles: i.blocked_roles
                })

                if (hasRestrictions) return false

                return i.options.includes('ECONOMY_TEXT')
            })
            .slice(0, server.premium.available ? 10 : 1)

        const multiplier = multipliers.reduce((x, y) => x * (y.economy_text_multiplier / 100), 100) / 100
        let amount: number =
            Math.random() * (currency.income.messages.range_per_message[1] - currency.income.messages.range_per_message[0]) +
            currency.income.messages.range_per_message[0]

        amount *= multiplier || 1

        if (userWallet.currencies.some(c => c.id === currency.id)) {
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
        guildId: message.guildId,
        targetId: message.author.id,
        module: 'Economy',
        category: 'MessageCreate'
    })

    return true
}

export async function voiceAssign(self: Lacuna, server: ServerDocument, state: VoiceState) {
    if (!server.modules.economy.active || !server.modules.economy.currencies.length || !server.premium.available) return false

    const members = state.channel.members.filter(m => !m.user.bot && !m.voice.serverMute && !m.voice.serverDeaf)

    if (members.size < 2) return false

    for (const [, member] of members) {
        const user = await self.db.users.fetch(
            { _id: member.id },
            {
                user: {
                    username: member.user.username,
                    avatar: member.user.avatar,
                    flags: member.user.flags?.bitfield ?? 0,
                    global_name: member.user.globalName
                }
            }
        )

        const userWallet = await self.db.users.fetchWallet(user, server._id)
        await self.db.users.fetchServerProfile(user, server._id, {
            accent_color: member.displayColor,
            avatar: member.avatar,
            banner: null,
            nickname: member.nickname
        })

        if (!userWallet.activity.voice_connected_at || Date.now() - userWallet.activity.voice_connected_at > 36_000_000) {
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
        guildId: state.guild.id,
        targetId: state.id,
        module: 'Economy',
        category: 'VoiceAssign'
    })

    return true
}

export async function voiceUnassign(self: Lacuna, server: ServerDocument, state: VoiceState, channel: BaseGuildVoiceChannel) {
    if (!server.modules.economy.active || !server.modules.economy.currencies.length || !server.premium.available) return false

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
            const hasRestrictions = hasRestrictedPermissions({
                channel: channel,
                roles: member.roles.cache,
                allowedChannels: currency.income.allowed.channels,
                allowedRoles: currency.income.allowed.roles,
                blockedChannels: currency.income.blocked.channels,
                blockedRoles: currency.income.blocked.roles
            })

            if (hasRestrictions) continue

            const multipliers = server.modules.activities.multipliers
                .filter(i => {
                    if (i.blocked_channels.includes(channel.id)) return false
                    if (member.roles.cache.some(ii => i.blocked_roles.includes(ii.id))) return false
                    if (i.allowed_channels.length && !i.allowed_channels.includes(channel.id)) return false
                    if (i.allowed_roles.length && !member.roles.cache.some(ii => i.allowed_roles.includes(ii.id))) return false

                    return i.options.includes('ECONOMY_VOICE')
                })
                .slice(0, server.premium.available ? 10 : 1)

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
            guildId: member.guild.id,
            targetId: member.id,
            module: 'Economy',
            category: 'VoiceUnassign'
        })
    }
}

export async function purchaseItem(item: ServerModulesEconomyStoreItem, self: Lacuna, guild: Guild, member: GuildMember) {
    const user = await self.db.users.fetch(
        { _id: member.id },
        {
            user: {
                username: member.user.username,
                avatar: member.user.avatar,
                flags: member.user.flags?.bitfield ?? 0,
                global_name: member.user.globalName
            }
        }
    )

    const userWallet = await self.db.users.fetchWallet(user, guild.id)
    const measures = { MINUTES: 60, HOURS: 3600, DAYS: 86400 }

    if (
        !userWallet.currencies.find(c => c.id === item.currency_id) ||
        userWallet.currencies.find(c => c.id === item.currency_id).amount < item.purchase_price
    )
        return 'INSUFFICIENT_FUNDS'

    if (userWallet.transactions.some(t => t.type == 'PURCHASE' && t.details === `${item.id}:${item.references.join(',')}`)) {
        if (item.options.includes('TEMPORARY_REFERENCES')) {
            const transaction = userWallet.transactions.find(t => t.type === 'PURCHASE' && t.details === `${item.id}:${item.references.join(',')}`)

            const not_yet = (Date.now() - transaction.timestamp) / 1000 < item.references_duration.value * measures[item.references_duration.measure]

            if (not_yet) return 'PURCHASED'
        } else return 'PURCHASED'
    }

    if (item.type === 'CHANNEL') {
        const channels = guild.channels.cache.filter(c => c.manageable && item.references.includes(c.id)) as Collection<string, BaseGuildTextChannel>

        if (channels.size) {
            for (const [, channel] of channels) {
                try {
                    await channel.permissionOverwrites.create(member.id, { ViewChannel: true })
                } catch (err) {
                    this.self.logger.error({ module: 'Economy', action: 'PurchaseItemCreateOverwrites', err, guildId: guild.id })
                }
            }
        }
    }

    if (item.type === 'ROLE') {
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
            } else {
                try {
                    await member.roles.add(roles)
                } catch (err) {
                    this.self.logger.error({ module: 'Economy', action: 'PurchaseItemAddRoles', err, guildId: guild.id })
                }
            }
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
        guildId: guild.id,
        targetId: item.id,
        module: 'Economy',
        category: 'ItemPurchase'
    })

    return 'SUCCESS'
}
