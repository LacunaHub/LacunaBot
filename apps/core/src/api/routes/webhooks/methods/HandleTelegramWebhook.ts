import { handleTelegramWebhook as handleWebhook } from '@/api/modules/social-alerts/TelegramAlerts.js'
import APIError from '@/api/utility/APIError.js'
import { createHmac } from 'crypto'
import { type Context } from 'koa'

export default async function handleTelegramWebhook(ctx: Context) {
    const tbSignature = ctx.request.headers['x-tb-signature'] as string,
        data = ctx.request.body

    if (!tbSignature) ctx.throw(403, new APIError())

    const [sigAlgorithm, sigHmac] = tbSignature.split('=')
    const signature = createHmac(sigAlgorithm!, process.env.LCN_TELEGRAM_PUBLIC_BOT_HMAC_SECRET!)
        .update(`${data.channel_id}:${data.message_id}`)
        .digest('hex')

    if (sigHmac !== signature) ctx.throw(403, new APIError())

    handleWebhook(data)

    ctx.status = 204
}
