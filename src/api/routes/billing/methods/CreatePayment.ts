import { APIUser } from 'discord.js'
import { Context } from 'koa'
import database from '../../../../database'
import { PaymentData } from '../../../modules/billing'
import { PayPalOrder } from '../../../modules/billing/providers/PayPal/Order'
import { TokensCheckout } from '../../../modules/billing/providers/Tokens'
import APIError from '../../../utility/APIError'

export default async function createPayment(ctx: Context) {
    const currentUser: Partial<APIUser> = ctx.state.user
    const { product: selectedProduct, payment_method: paymentMethod, guild_id: guildId, guild_name: guildName } = ctx.request.body
    const products = await database.getProducts(),
        product = products.find(v => v.tier === selectedProduct?.tier)

    if (!product) ctx.throw(400, new APIError(1021))

    const server = await database.servers.findOne({ _id: guildId })

    if (!server || server.blocked) {
        ctx.throw(404, new APIError(1003))
    }

    const data: PaymentData = {
        amount: {
            currency_code: 'USD',
            value: 0
        },
        payerId: currentUser.id,
        comment: `Lacuna Diamond for ${guildName.slice(0, 32)} (${guildId})`,
        product,
        refId: guildId
    }

    if (paymentMethod === 'PayPal') {
        const price = product.prices.find(v => v.currency_code === data.amount.currency_code)
        if (!price) ctx.throw(400, new APIError(4021))

        data.amount.value = price.sale_amount ? price.sale_amount : price.amount
        const order = new PayPalOrder(data)
        const { order: paypalOrder } = await order.create()
        const approveLink = paypalOrder?.links?.find(v => v.rel === 'approve')?.href

        if (typeof approveLink !== 'string') ctx.throw(500, new APIError(5012))

        ctx.status = 200
        ctx.body = approveLink
    } else if (paymentMethod === 'Tokens') {
        data.amount.currency_code = 'TKN'
        const env = await database.getEnv()

        if (env.diamondForTokensDisabled) ctx.throw(403, new APIError(4024))

        const price = product.prices.find(v => v.currency_code === data.amount.currency_code)
        if (!price) ctx.throw(400, new APIError(4021))

        data.amount.value = price.sale_amount ? price.sale_amount : price.amount
        const user = await database.users.findOne({ _id: currentUser.id })

        if (!user) ctx.throw(404, new APIError(1001))
        if (user.tokens <= data.amount.value) ctx.throw(400, new APIError(4023))

        const tokensCheckout = new TokensCheckout(data),
            payment = await tokensCheckout.create()

        ctx.status = 204
    } else {
        ctx.throw(400, new APIError(1020))
    }
}
