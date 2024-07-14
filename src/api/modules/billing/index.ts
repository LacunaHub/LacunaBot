import {
    DiamondProductTier,
    PaymentAmount,
    PaymentDocument,
    PaymentStatus,
    PaymentType,
    Product,
    ServerDocument,
    SubscriptionDocument,
    SubscriptionMetadataProduct,
    SubscriptionStatus,
    SubscriptionType
} from '@lacunahub/lacuna-database-driver'
import database from '../../../database'
import Logger from '../../../internals/Logger'
import { activePatronRoleId, bigPatronRoleId, supportServerId } from '../../../internals/utility/Constants'
import DiscordUtils from '../../utility/DiscordUtils'
import { DiamondGuild, diamondGuilds } from './utility/DiamondGuild'
import { Patron, patrons } from './utility/Patron'

export async function addDiamond(bill: PaymentDocument | SubscriptionDocument, options: AddDiamondOptions = {}) {
    const isPayment = 'payer_id' in bill,
        isSubscription = 'subscriber_id' in bill
    let { server, until } = options

    if (!server) {
        server = await database.servers.findOne({ _id: bill.metadata.ref_id })
    }

    const [sBillType, sBillId] = server.premium.charged_via?.split(':') ?? []

    // if the server has diamond via subscription
    // we need to set status to "Cancelled" for it
    if (sBillId && bill._id !== sBillId && sBillType === 'Subscription') {
        const sBill = await database.subscriptions.findOne({ _id: sBillId })

        if (sBill) {
            Logger.log(`[Billing] Guild ${server._id} has diamond via "${SubscriptionType[sBill.type]}"`)

            await database.subscriptions.updateOne(
                { _id: sBill._id },
                {
                    $set: {
                        status: SubscriptionStatus.Cancelled,
                        updated_at: Date.now()
                    }
                }
            )

            Logger.log(`[Billing] Bill "${sBill._id}" with type "${SubscriptionType[sBill.type]}" for guild ${server._id} has been cancelled`)
        }
    }

    if (typeof until !== 'number') {
        const date = server.premium.expires_at ? new Date(server.premium.expires_at) : new Date()

        if (isSubscription) {
            until = date.setHours(date.getHours() + 6)
        } else if (bill.type === PaymentType.Tokens) {
            if ([DiamondProductTier.OneDay, DiamondProductTier.SevenDays].includes(bill.metadata.tier)) {
                until = date.setHours(date.getHours() + bill.amount.value * 24)
            } else if (bill.metadata.tier === DiamondProductTier.OneMonth) {
                until = date.setMonth(date.getMonth() + 1)
            }
        } else {
            let monthCount: number

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

    let billType: 'Payment' | 'Subscription'

    if (isPayment) billType = 'Payment'
    else if (isSubscription) billType = 'Subscription'

    await database.servers.updateOne(
        { _id: server._id },
        {
            $set: {
                'premium.available': true,
                'premium.expires_at': until,
                'premium.charged_via': `${billType}:${bill._id}`
            }
        }
    )

    let diamondGuild = diamondGuilds.get(server._id)

    if (diamondGuild) {
        Logger.log(`[Billing] Renewing Diamond for guild ${server._id}`)
        diamondGuild.cancel()
    }

    if (isSubscription) {
        if (bill.type === SubscriptionType.DiscordNitroBoost) {
            Logger.log(`[Billing] Nitro Boost "${bill._id}" for guild ${server._id} successfully verified`)
        } else {
            Logger.log(`[Billing] Diamond Subscription "${bill._id}" for guild ${server._id} successfully verified`)
        }
    } else {
        Logger.log(`[Billing] Bill "${bill._id}" for guild ${server._id} successfully charged`)
    }

    diamondGuild = new DiamondGuild(server._id, until, bill._id, billType)
    const patron = await addPremium(bill, until)

    return { diamondGuild, patron }
}

export async function addPremium(bill: PaymentDocument | SubscriptionDocument, until: number) {
    const isPayment = 'payer_id' in bill,
        isSubscription = 'subscriber_id' in bill

    if (isSubscription && bill.type === SubscriptionType.DiscordNitroBoost) return null

    let userId: string

    if (isPayment) userId = bill.payer_id
    else if (isSubscription) userId = bill.subscriber_id

    await database.users.updateOne(
        { _id: userId },
        {
            $set: {
                'premium.available': true,
                'premium.expiration_timestamp': until,
                'premium.last_charge_timestamp': Date.now()
            }
        }
    )

    if (isPayment && [PaymentType.PayPal].includes(bill.type)) {
        const userBills = await database.payments.find({
                type: { $in: [PaymentType.PayPal] },
                status: PaymentStatus.Paid,
                payer_id: userId
            }),
            supportedAmount = userBills.reduce(
                (x, y) => {
                    x[y.amount.currency_code] += y.amount.value
                    return x
                },
                { RUB: 0, USD: 0 }
            )
        const patronRoles = [activePatronRoleId]

        if (supportedAmount.RUB >= 1000 || supportedAmount.USD >= 15) {
            patronRoles.push(bigPatronRoleId)
        }

        for (const role of patronRoles) {
            try {
                await DiscordUtils.rest.put(DiscordUtils.restRoutes.guildMemberRole(supportServerId, userId, role))
            } catch (err) {
                await Logger.handleError({ module: 'Billing', action: 'AddPatronRoles', error: err })
            }
        }
    }

    const patron = patrons.get(userId)

    if (patron) {
        Logger.log(`[Billing] Renewing patronage for user ${userId}`)
        patron.cancel()
    } else {
        Logger.log(`[Billing] User ${userId} became a Patron`)
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
