import Logger from '@/api/utility/Logger.js'
import database, { DiamondProductTier, type Product } from '@/database/index.js'
import { type PaymentAmount, type PaymentDocument, PaymentType } from '@/database/schemas/Payments.js'
import { type ServerDocument } from '@/database/schemas/Servers.js'
import {
    type SubscriptionDocument,
    SubscriptionMetadataProduct,
    SubscriptionStatus,
    SubscriptionType
} from '@/database/schemas/Subscriptions.js'
import { activePatronRoleId, longTermPatronRoleId, supportServerId } from '../../../internals/utility/Constants.js'
import DiscordUtils from '../../utility/DiscordUtils.js'
import { DiamondGuild, diamondGuilds } from './utility/DiamondGuild.js'
import { Patron, patrons } from './utility/Patron.js'

export async function addDiamond(bill: PaymentDocument | SubscriptionDocument, options: AddDiamondOptions = {}) {
    const isPayment = 'payer_id' in bill,
        isSubscription = 'subscriber_id' in bill
    let { server, until } = options

    if (!server) {
        server = await database.servers.findOne({ _id: bill.metadata.ref_id }).orFail()
    }

    const [sBillType, sBillId] = server!.premium.charged_via?.split(':') ?? []

    // if the server has diamond via subscription
    // we need to set status to "Cancelled" for it
    if (sBillId && bill._id !== sBillId && sBillType === 'Subscription') {
        const sBill = await database.subscriptions.findOne({ _id: sBillId })

        if (sBill) {
            Logger.info({ guildId: server!._id, billId: sBill._id }, 'cancelling diamond subscription')

            await database.subscriptions.updateOne(
                { _id: sBill._id },
                {
                    $set: {
                        status: SubscriptionStatus.Cancelled,
                        updated_at: Date.now()
                    }
                }
            )

            Logger.info({ guildId: server!._id, billId: sBill._id }, 'diamond subscription cancelled')
        }
    }

    if (typeof until !== 'number') {
        const date = server!.premium.expires_at ? new Date(server!.premium.expires_at) : new Date()

        if (isSubscription) {
            until = date.setHours(date.getHours() + 6)
        } else if (bill.type === PaymentType.Tokens) {
            if ([DiamondProductTier.OneDay, DiamondProductTier.SevenDays].includes(bill.metadata.tier)) {
                until = date.setHours(date.getHours() + bill.amount.value * 24)
            } else if (bill.metadata.tier === DiamondProductTier.OneMonth) {
                until = date.setMonth(date.getMonth() + 1)
            }
        } else {
            let monthCount: number = 0

            switch (bill.metadata.tier) {
                case DiamondProductTier.OneMonth:
                    monthCount = 1
                    break
                case DiamondProductTier.TwoMonths:
                    monthCount = 2
                    break
                case DiamondProductTier.TwelveMonths:
                    monthCount = 12
                    break
            }

            until = date.setMonth(date.getMonth() + monthCount)
        }
    }

    let billType!: 'Payment' | 'Subscription'
    if (isPayment) billType = 'Payment'
    else if (isSubscription) billType = 'Subscription'

    await database.servers.updateOne(
        { _id: server!._id },
        {
            $set: {
                'premium.available': true,
                'premium.expires_at': until,
                'premium.charged_via': `${billType}:${bill._id}`
            }
        }
    )

    let diamondGuild = diamondGuilds.get(server!._id)

    if (diamondGuild) {
        Logger.info({ guildId: server!._id }, 'renewing diamond')
        diamondGuild.cancel()
    }

    if (isSubscription) {
        if (bill.type === SubscriptionType.DiscordNitroBoost) {
            Logger.info({ guildId: server!._id, billId: bill._id }, 'nitro boost verified')
        } else {
            Logger.info({ guildId: server!._id, billId: bill._id }, 'diamond subscription verified')
        }
    } else {
        Logger.info({ guildId: server!._id, billId: bill._id }, 'diamond payed')
    }

    diamondGuild = new DiamondGuild(server!._id, until!, bill._id, billType)
    const patron = await addPremium(bill, until!)

    return { diamondGuild, patron }
}

export async function addPremium(bill: PaymentDocument | SubscriptionDocument, until: number) {
    const isPayment = 'payer_id' in bill,
        isSubscription = 'subscriber_id' in bill

    if (isSubscription && bill.type === SubscriptionType.DiscordNitroBoost) return null

    let userId!: string
    if (isPayment) userId = bill.payer_id
    else if (isSubscription) userId = bill.subscriber_id

    const dateNow = Date.now()
    await database.users.updateOne(
        { _id: userId },
        {
            $set: {
                'premium.available': true,
                'premium.expiration_timestamp': until,
                'premium.last_charge_timestamp': dateNow
            },
            $inc: {
                'premium.for_how_long': Math.ceil((until - dateNow) / 1000)
            }
        }
    )

    const user = await database.users.findOne({ _id: userId }).orFail().lean()
    const rolesToAdd = [activePatronRoleId]

    if (user.premium.for_how_long >= 60 * 60 * 24 * 365) rolesToAdd.push(longTermPatronRoleId)

    for (const role of rolesToAdd) {
        try {
            await DiscordUtils.rest.put(DiscordUtils.restRoutes.guildMemberRole(supportServerId, userId, role))
        } catch (err) {
            Logger.error({ module: 'Billing', action: 'AddPatronRoles', err })
        }
    }

    const patron = patrons.get(userId)

    if (patron) {
        Logger.info({ billId: bill._id, userId }, 'renewing patronage')
        patron.cancel()
    } else {
        Logger.info({ billId: bill._id }, 'new patron')
    }

    return new Patron(userId, until)
}

export interface AddDiamondOptions {
    server?: ServerDocument
    until?: number
}

export interface PaymentData {
    amount: PaymentAmount
    payerId: string
    comment?: string
    product: Product
    refId: string
}

export interface SubscriptionData {
    subscriberId: string
    productId: SubscriptionMetadataProduct
    refId: string
}
