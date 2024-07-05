import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { APIWebhook, resolveImage } from 'discord.js'
import { Context } from 'koa'
import database from '../../../../database'
import Logger from '../../../../internals/Logger'
import { hubSubscribe } from '../../../modules/social-alerts/YouTubeAlerts'
import APIError from '../../../utility/APIError'
import DiscordUtils from '../../../utility/DiscordUtils'

export default async function updateYouTubeSocialAlert(ctx: Context) {
    const guildId: string = ctx.params.guild_id,
        method: string = ctx.params.method
    const data = ctx.request.body

    const server = await database.servers.findOne({ _id: guildId })

    if (!server || server.blocked) {
        ctx.throw(404, new APIError(1003))
    }

    let response: any

    try {
        switch (method) {
            case 'create':
                response = await createYouTubeSocialAlert(server, data)
                break

            case 'update':
                response = await setYouTubeSocialAlert(server, data)
                break

            case 'delete':
                response = await deleteYouTubeSocialAlert(server, data)
                break

            default:
                throw new APIError(4017)
        }
    } catch (err) {
        ctx.throw(400, { code: err.code, message: err.message })
    }

    ctx.status = 200
    ctx.body = response
}

export async function createYouTubeSocialAlert(server: ServerDocument, data: any) {
    const subscriptions = server.modules.subscriptions.youtube

    if (subscriptions.length >= 1 && !server.premium.available) throw new APIError(3011)
    if (subscriptions.length >= 10) throw new APIError(3012)
    if (subscriptions.some(s => s.channel_id === data.channel.id)) throw new APIError(2007)

    let webhook: APIWebhook

    try {
        webhook = (await DiscordUtils.rest.post(DiscordUtils.restRoutes.channelWebhooks(data.notification_channel_id), {
            body: {
                name: data.channel.name,
                avatar: await resolveImage(data.channel.thumbnail)
            }
        })) as any
    } catch (err) {
        await Logger.handleError({
            module: 'YouTubeSubs',
            action: 'CreateWebhook',
            error: err,
            guild_id: server._id
        })

        throw new APIError(5009)
    }

    const youtubeSub = await database.youtubeSubs.findOne({ _id: data.channel.id })

    if (!youtubeSub) {
        const hubSubscribeResponse = await hubSubscribe(data.channel.id)

        if (hubSubscribeResponse.ok) {
            await database.youtubeSubs.create({
                _id: data.channel.id,
                channel_name: data.channel.name,
                channel_thumbnail_url: data.channel.thumbnail
            } as any)
        } else {
            throw new APIError(5017)
        }
    }

    const subscription = {
        channel_id: data.channel.id,
        channel_name: data.channel.name,
        channel_thumbnail_url: data.channel.thumbnail,
        notification_channel_id: data.notification_channel_id,
        notification_message: data.notification_message,
        webhook_id: webhook?.id ?? null,
        webhook_token: webhook?.token ?? null,
        options: data.options ?? []
    }

    await database.servers.updateOne(
        { _id: server._id },
        {
            $push: {
                'modules.subscriptions.youtube': subscription
            }
        }
    )

    return subscription
}

export async function setYouTubeSocialAlert(server: ServerDocument, data: any) {
    const subscription = server.modules.subscriptions.youtube.find(i => i.channel_id === data.channel_id)

    if (!subscription) throw new APIError(1016)

    await database.servers.updateOne(
        { _id: server._id, 'modules.subscriptions.youtube.channel_id': data.channel_id },
        {
            $set: {
                'modules.subscriptions.youtube.$.notification_channel_id': data.notification_channel_id,
                'modules.subscriptions.youtube.$.notification_message': data.notification_message,
                'modules.subscriptions.youtube.$.options': data.options ?? []
            }
        }
    )

    if (subscription.notification_channel_id !== data.notification_channel_id) {
        try {
            await DiscordUtils.rest.patch(DiscordUtils.restRoutes.webhook(subscription.webhook_id), {
                body: {
                    channel_id: data.notification_channel_id
                }
            })
        } catch (err) {
            await Logger.handleError({
                module: 'YouTubeSubs',
                action: 'UpdateWebhook',
                error: err,
                guild_id: server._id
            })
        }
    }

    return data
}

export async function deleteYouTubeSocialAlert(server: ServerDocument, data: any) {
    const subscription = server.modules.subscriptions.youtube.find(s => s.channel_id === data.channel_id)

    if (!subscription) throw new APIError(1016)

    await database.servers.updateOne(
        { _id: server._id },
        {
            $pull: {
                'modules.subscriptions.youtube': {
                    channel_id: subscription.channel_id
                }
            }
        }
    )

    const subscribedGuilds = await database.servers.find({
        'modules.subscriptions.youtube.channel_id': subscription.channel_id
    })

    if (!subscribedGuilds.length) {
        try {
            await hubSubscribe(subscription.channel_id, 'unsubscribe')
            await database.youtubeSubs.deleteOne({ _id: subscription.channel_id })
        } catch (err) {
            await Logger.handleError({
                module: 'YouTubeSubs',
                action: 'DeleteSubscription',
                error: err,
                guild_id: server._id
            })

            throw new APIError(5018)
        }
    }

    if (subscription.webhook_id) {
        try {
            await DiscordUtils.rest.delete(DiscordUtils.restRoutes.webhook(subscription.webhook_id, subscription.webhook_token))
        } catch (err) {
            await Logger.handleError({
                module: 'YouTubeSubs',
                action: 'DeleteWebhook',
                error: err,
                guild_id: server._id
            })
        }
    }

    return true
}
