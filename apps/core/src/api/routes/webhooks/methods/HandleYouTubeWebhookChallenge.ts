import APIError from '@/api/utility/APIError.js'
import database from '@/database/index.js'
import { type Context } from 'koa'

export default async function handleYouTubeWebhookChallenge(ctx: Context) {
    const hubTopic = ctx.query['hub.topic'] as string,
        hubChallenge = ctx.query['hub.challenge'] as string,
        hubMode = ctx.query['hub.mode'] as string
    let hubLeaseSeconds = ctx.query['hub.lease_seconds'] as string

    ctx.assert(hubTopic && hubChallenge && hubMode, 404, new APIError())

    const [, topicQuery] = hubTopic.split('?')
    const topicParams = new URLSearchParams(topicQuery)
    const channelId = topicParams.get('channel_id')!

    if (hubMode === 'subscribe') {
        hubLeaseSeconds = isNaN(hubLeaseSeconds as any) ? null : (Number(hubLeaseSeconds) as any)
        const subscription = await database.youtubeSubs.findOne({ _id: channelId })

        ctx.assert(hubLeaseSeconds && subscription, 404, new APIError())

        await database.youtubeSubs.updateOne(
            { _id: channelId },
            { $set: { expiration_timestamp: Date.now() + (hubLeaseSeconds as any) * 1000 } }
        )
    }

    if (hubMode === 'unsubscribe') {
        await database.youtubeSubs.deleteOne({ _id: channelId })
    }

    ctx.status = 200
    ctx.body = hubChallenge
}
