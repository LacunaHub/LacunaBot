import { eventSubUnsubscribe, handleIncomingWebhook } from '@/api/modules/social-alerts/TwitchAlerts.js'
import APIError from '@/api/utility/APIError.js'
import database from '@/database/index.js'
import { createHmac } from 'crypto'
import { type Context, type Next } from 'koa'

export default async function handleTwitchWebhook(ctx: Context) {
    const messageId = ctx.request.headers['twitch-eventsub-message-id'] as string,
        messageType = ctx.request.headers['twitch-eventsub-message-type']

    if (messageType === 'webhook_callback_verification') {
        ctx.status = 200
        ctx.set('Content-Type', 'text/plain')
        ctx.body = ctx.request.body.challenge

        return
    }

    if (messageType === 'revocation') {
        const { subscription } = ctx.request.body

        try {
            await eventSubUnsubscribe(subscription.id)
        } catch (err) {}

        await database.twitchSubs.deleteOne({ _id: subscription.id })
        await database.servers.updateMany(
            { 'modules.subscriptions.twitch.broadcaster_id': subscription.condition.broadcaster_user_id },
            {
                $pull: {
                    'modules.subscriptions.twitch': {
                        broadcaster_id: subscription.condition.broadcaster_user_id
                    }
                }
            }
        )

        ctx.status = 204

        return
    }

    handleIncomingWebhook(messageId, ctx.request.body)

    ctx.status = 204
}

export function authenticateEventSub(ctx: Context, next: Next) {
    const messageId = ctx.request.headers['twitch-eventsub-message-id'] as string,
        messageTimestamp = ctx.request.headers['twitch-eventsub-message-timestamp'] as string,
        messageSignature = ctx.request.headers['twitch-eventsub-message-signature']

    const time = (Date.now() - new Date(messageTimestamp).getTime()) / 1000

    if (time > 600) {
        ctx.status = 204

        return
    }

    const signature = createHmac('sha256', process.env.LCN_TWITCH_SIGNING_SECRET!)
        .update(messageId + messageTimestamp + JSON.stringify(ctx.request.body))
        .digest('hex')

    if (messageSignature === `sha256=${signature}`) {
        next()
    } else {
        ctx.throw(403, new APIError())
    }
}
