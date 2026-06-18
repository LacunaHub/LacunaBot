import { eventSubUnsubscribe } from '@/api/modules/social-alerts/TwitchAlerts.js'
import APIError from '@/api/utility/APIError.js'
import DiscordUtils from '@/api/utility/DiscordUtils.js'
import database from '@/database/index.js'
import { type ServerDocument } from '@/database/schemas/Servers.js'
import { type Context } from 'koa'

export default async function deleteTwitchSubscription(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const channelId: string = ctx.params.channelId

    const twitchSubscription = server.modules.subscriptions.twitch.find(v => v.broadcaster_id === channelId)
    if (!twitchSubscription) ctx.throw(404, new APIError(1014))

    await database.servers.updateOne(
        { _id: server._id },
        {
            $pull: {
                'modules.subscriptions.twitch': {
                    broadcaster_id: twitchSubscription.broadcaster_id
                }
            }
        }
    )

    const subscribedGuilds = await database.servers.find({
        'modules.subscriptions.twitch.broadcaster_id': twitchSubscription.broadcaster_id
    })

    if (!subscribedGuilds.length) {
        const twitchSub = await database.twitchSubs
            .findOne({ broadcaster_id: twitchSubscription.broadcaster_id })
            .orFail()

        try {
            await eventSubUnsubscribe(twitchSub?._id)
            await database.twitchSubs.deleteMany({ broadcaster_id: twitchSubscription.broadcaster_id })
        } catch (err) {
            ctx.log.error({
                module: 'TwitchSubs',
                action: 'DeleteEventSub',
                err,
                guildId: server._id
            })

            ctx.throw(500, new APIError(5016))
        }
    }

    if (twitchSubscription.webhook_id) {
        try {
            await DiscordUtils.rest.delete(
                DiscordUtils.restRoutes.webhook(twitchSubscription.webhook_id, twitchSubscription.webhook_token)
            )
        } catch (err) {
            ctx.log.error({
                module: 'TwitchSubs',
                action: 'DeleteWebhook',
                err,
                guildId: server._id
            })
        }
    }

    ctx.status = 204
}
