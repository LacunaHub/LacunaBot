import { DiamondProductTier, PaymentType, SubscriptionType } from '@lacunahub/lacuna-database-driver'
import { Context } from 'koa'
import database from '../../../../database'

export default async function getProducts(ctx: Context) {
    const products = await database.getProducts(),
        env = await database.getEnv()
    const paymentMethods = []

    if (!env.paypalDisabled) paymentMethods.push({ name: 'PayPal', value: PaymentType[PaymentType.PayPal] })
    if (!env.patreonDisabled) paymentMethods.push({ name: 'Patreon', value: SubscriptionType[SubscriptionType.Patreon] })
    if (!env.boostyDisabled) paymentMethods.push({ name: 'Boosty', value: SubscriptionType[SubscriptionType.Boosty] })
    if (!env.diamondForTokensDisabled) paymentMethods.push({ name: 'Tokens', value: PaymentType[PaymentType.Tokens] })
    if (!env.diamondForBoostsDisabled)
        paymentMethods.push({ name: 'Discord Nitro Boost', value: SubscriptionType[SubscriptionType.DiscordNitroBoost] })

    ctx.status = 200
    ctx.body = {
        products: products.map(v => {
            return {
                ...v,
                duration_seconds: convertTierToDuration(v.tier)
            }
        }),
        payment_methods: paymentMethods
    }
}

function convertTierToDuration(tier: DiamondProductTier): number {
    const hour = 60 * 60,
        day = 24 * hour,
        week = 7 * day,
        month = 30 * day,
        year = 365 * day

    const tiersMap = {
        SixHours: 6 * hour,
        OneDay: day,
        SevenDays: week,
        OneMonth: month,
        TwoMonths: 2 * month,
        ThreeMonths: 3 * month,
        FourMonths: 4 * month,
        FiveMonths: 5 * month,
        SixMonths: 6 * month,
        SevenMonths: 7 * month,
        EightMonths: 8 * month,
        NineMonths: 9 * month,
        TenMonths: 10 * month,
        ElevenMonths: 11 * month,
        TwelveMonths: year
    }

    return tiersMap[DiamondProductTier[tier]]
}
