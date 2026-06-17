import { handleHubBubWebhook } from '@/api/modules/social-alerts/YouTubeAlerts.js'
import APIError from '@/api/utility/APIError.js'
import { convertXml2Json } from '@/internals/utility/Utils.js'
import { createHmac } from 'crypto'
import { type Context } from 'koa'
import getRawBody from 'raw-body'

export default async function handleYouTubeWebhook(ctx: Context) {
    const hubSignature = ctx.request.headers['x-hub-signature'] as string

    if (!hubSignature) ctx.throw(403, new APIError())

    const data = await getRawBody(ctx.req).then(async str => {
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

    if (!entry) ctx.throw(400, new APIError())

    const [algorithm, hmac] = hubSignature.split('=')

    const signature = createHmac(algorithm!, process.env.LCN_YOUTUBE_HMAC_SECRET!).update(rawBody).digest('hex')

    if (hmac !== signature) {
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
