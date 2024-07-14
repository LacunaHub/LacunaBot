import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { Context } from 'koa'
import database from '../../../../../database'
import Logger from '../../../../../internals/Logger'
import { eventSubUnsubscribe } from '../../../../modules/social-alerts/TwitchAlerts'
import APIError from '../../../../utility/APIError'
import DiscordUtils from '../../../../utility/DiscordUtils'

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
        const twitchSub = await database.twitchSubs.findOne({ broadcaster_id: twitchSubscription.broadcaster_id })

        try {
            await eventSubUnsubscribe(twitchSub?._id)
            await database.twitchSubs.deleteMany({ broadcaster_id: twitchSubscription.broadcaster_id })
        } catch (err) {
            await Logger.handleError({
                module: 'TwitchSubs',
                action: 'DeleteEventSub',
                error: err,
                guild_id: server._id
            })

            ctx.throw(500, new APIError(5016))
        }
    }

    if (twitchSubscription.webhook_id) {
        try {
            await DiscordUtils.rest.delete(DiscordUtils.restRoutes.webhook(twitchSubscription.webhook_id, twitchSubscription.webhook_token))
        } catch (err) {
            await Logger.handleError({
                module: 'TwitchSubs',
                action: 'DeleteWebhook',
                error: err,
                guild_id: server._id
            })
        }
    }

    ctx.status = 204
}
