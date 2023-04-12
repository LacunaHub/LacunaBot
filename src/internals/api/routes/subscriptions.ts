import Router from '@koa/router'
import crypto from 'crypto'
import { Context, Next } from 'koa'
import rawBodyParser from 'raw-body'
import db from '../../../database'
import { ServerDocument } from '../../../database/schemas/Servers'
import { eventSubUnsubscribe, handleIncomingWebhook, searchChannels as searchTwitchChannels } from '../../../modules/Twitch'
import { handleHubBubWebhook, searchChannels as searchYouTubeChannels } from '../../../modules/YouTube'
import { convertXml2Json } from '../../utility/Utils'
import { authorize } from '../utility/Authorize'
import { createRateLimitMiddleware } from '../utility/Utils'

const router: Router = new Router({ prefix: '/subscriptions' })
const rateLimitMiddleware = createRateLimitMiddleware(5, 300000)

router.get('/twitch/search', rateLimitMiddleware, authorize, searchTwitch)
router.get('/youtube/search', rateLimitMiddleware, authorize, searchYouTube)
router.post('/twitch/eventsub-webhook', eventSubAuthentication, eventSubWebhook)
router.get('/youtube/hubbub-webhook', hubbubWebhookChallenge)
router.post('/youtube/hubbub-webhook', hubbubWebhook)

async function searchTwitch(ctx: Context) {
    const guild_id = ctx.query.gid as string
    const query = ctx.query.q as string

    if (!guild_id || !query) ctx.throw(400)

    const server: ServerDocument = await db.servers.findOne({ _id: guild_id })

    if (!server || server.server.blocked) ctx.throw(404)

    const channels = await searchTwitchChannels(query)

    if (!channels?.length) ctx.throw(404)

    const added = server.modules.subscriptions.twitch

    ctx.status = 200
    ctx.body = channels.filter(channel => !added.some(s => s.broadcaster_id == channel.id))
}

async function searchYouTube(ctx: Context) {
    const guild_id = ctx.query.gid as string
    const query = ctx.query.q as string

    if (!guild_id || !query) ctx.throw(400)

    const server: ServerDocument = await db.servers.findOne({ _id: guild_id })

    if (!server || server.server.blocked) ctx.throw(404)

    const channels = await searchYouTubeChannels(query)

    if (!channels?.length) ctx.throw(404)

    const added = server.modules.subscriptions.youtube

    ctx.status = 200
    ctx.body = channels.filter(channel => !added.some(s => s.channel_id == channel.id))
}

async function eventSubWebhook(ctx: Context) {
    const messageId = ctx.request.headers['twitch-eventsub-message-id'] as string
    const messageType = ctx.request.headers['twitch-eventsub-message-type']

    if (messageType == 'webhook_callback_verification') {
        ctx.status = 200
        ctx.set('Content-Type', 'text/plain')
        ctx.body = ctx.request.body.challenge

        return
    }

    if (messageType == 'revocation') {
        const { subscription } = ctx.request.body

        await eventSubUnsubscribe(subscription.id).catch(() => {})
        await db.twitchSubs.deleteOne({ _id: subscription.id })
        await db.servers.updateMany(
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

function eventSubAuthentication(ctx: Context, next: Next) {
    const messageId = ctx.request.headers['twitch-eventsub-message-id'] as string
    const messageTimestamp = ctx.request.headers['twitch-eventsub-message-timestamp'] as string
    const messageSignature = ctx.request.headers['twitch-eventsub-message-signature']

    const time = (Date.now() - new Date(messageTimestamp).getTime()) / 1000

    if (time > 600) {
        ctx.status = 204

        return
    }

    const signature = crypto
        .createHmac('sha256', process.env.TWITCH_SIGNING_SECRET)
        .update(messageId + messageTimestamp + ctx.request.rawBody)
        .digest('hex')

    if (messageSignature == `sha256=${signature}`) next()
    else ctx.throw(403)
}

async function hubbubWebhookChallenge(ctx: Context) {
    const hubTopic = ctx.query['hub.topic'] as string
    const hubChallenge = ctx.query['hub.challenge'] as string
    const hubMode = ctx.query['hub.mode'] as string
    let hubLeaseSeconds = ctx.query['hub.lease_seconds'] as string

    ctx.assert(hubTopic && hubChallenge && hubMode, 404)

    const [, topicQuery] = hubTopic.split('?')
    const topicParams = new URLSearchParams(topicQuery)
    const channelId = topicParams.get('channel_id')

    if (hubMode == 'subscribe') {
        hubLeaseSeconds = isNaN(hubLeaseSeconds as any) ? null : (Number(hubLeaseSeconds) as any)
        const subscription = await db.youtubeSubs.findOne({ _id: channelId })

        ctx.assert(hubLeaseSeconds && subscription, 404)

        await db.youtubeSubs.updateOne({ _id: channelId }, { $set: { expiration_timestamp: Date.now() + (hubLeaseSeconds as any) * 1000 } })
    }

    if (hubMode == 'unsubscribe') {
        await db.youtubeSubs.deleteOne({ _id: channelId })
    }

    ctx.status = 200
    ctx.body = hubChallenge
}

async function hubbubWebhook(ctx: Context) {
    const hubSignature = ctx.request.headers['x-hub-signature'] as string

    if (!hubSignature) ctx.throw(403)

    const data = await rawBodyParser(ctx.req).then(async str => {
        const body = (await convertXml2Json(str)) as any

        return {
            body,
            rawBody: str
        }
    })

    const { body, rawBody } = data

    if (body?.feed?.['at:deleted-entry']) {
        ctx.status = 204

        return
    }

    const [entry] = body.feed?.entry

    if (!entry) ctx.throw(400)

    const [algorithm, hmac] = hubSignature.split('=')

    const signature = crypto.createHmac(algorithm, process.env.YOUTUBE_HMAC_SECRET).update(rawBody).digest('hex')

    if (hmac != signature) {
        ctx.status = 204

        return
    }

    const videoId = entry['yt:videoId'][0]
    const videoTitle = entry.title[0]
    const channelId = entry['yt:channelId'][0]
    const channelName = entry.author[0]?.name[0]
    const publishedTimestamp = new Date(entry.published[0]).getTime()
    const updatedTimestamp = new Date(entry.updated[0]).getTime()

    if (updatedTimestamp - publishedTimestamp > 300000) {
        ctx.status = 204

        return
    }

    handleHubBubWebhook({
        videoId,
        videoTitle,
        channelId,
        channelName,
        publishedTimestamp,
        updatedTimestamp
    })

    ctx.status = 204
}

export default router
