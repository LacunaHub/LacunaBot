import { createHmac, timingSafeEqual } from 'crypto'
import { APIMessage, APIThreadChannel } from 'discord.js'
import { Context, Next } from 'koa'
import { newsChannelId, newsRoleId } from '../../../../internals/utility/Constants'
import APIError from '../../../utility/APIError'
import DiscordUtils from '../../../utility/DiscordUtils'

export default async function handleGitHubWebhook(ctx: Context) {
    const event = ctx.request.headers['x-github-event'] as string,
        data = ctx.request.body

    if (
        event === 'discussion' &&
        data.action === 'created' &&
        data.discussion.category.slug === 'новости' &&
        data.repository.full_name === 'LacunaHub/.github'
    ) {
        const { title, body, html_url } = data.discussion

        const message = (await DiscordUtils.rest.post(DiscordUtils.restRoutes.channelMessages(newsChannelId), {
            body: {
                content: `# [${title}](<${html_url}>)\n\n${body}`
            }
        })) as APIMessage

        await DiscordUtils.rest.post(DiscordUtils.restRoutes.channelMessageCrosspost(newsChannelId, message.id))
        const thread = (await DiscordUtils.rest.post(DiscordUtils.restRoutes.threads(newsChannelId, message.id), {
            body: {
                name: title
            }
        })) as APIThreadChannel

        await DiscordUtils.rest.post(DiscordUtils.restRoutes.channelMessages(thread.id), {
            body: {
                content: `<@&${newsRoleId || '1'}>`
            }
        })
    }

    ctx.status = 204
}

export async function verifyGitHubSignature(ctx: Context, next: Next) {
    const hubSignature = Buffer.from(ctx.request.headers['x-hub-signature-256'] as string, 'ascii'),
        data = ctx.request.body

    const signature = createHmac('sha256', process.env.LCN_GITHUB_WEBHOOK_SECRET).update(JSON.stringify(data)).digest('hex')

    if (timingSafeEqual(Buffer.from(`sha256=${signature}`, 'ascii'), hubSignature)) {
        await next()
    } else {
        ctx.throw(403, new APIError())
    }
}
