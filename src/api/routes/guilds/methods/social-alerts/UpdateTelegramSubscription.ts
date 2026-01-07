import { ServerDocument } from '@/database/schemas/Servers'
import { Context } from 'koa'
import database from '../../../../../database'
import Logger from '../../../../../internals/Logger'
import APIError from '../../../../utility/APIError'
import DiscordUtils from '../../../../utility/DiscordUtils'

export default async function updateTelegramSubscription(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const channelId: number = +ctx.params.channelId,
        data = ctx.request.body

    const tgSubscription = server.modules.subscriptions.telegram.find(v => v.channel_id === channelId)
    if (!tgSubscription) ctx.throw(404, new APIError(1014))

    await database.servers.updateOne(
        { _id: server._id, 'modules.subscriptions.telegram.channel_id': data.channel_id },
        {
            $set: {
                'modules.subscriptions.telegram.$.notification_channel_id': data.notification_channel_id,
                'modules.subscriptions.telegram.$.options': data.options,
                'modules.subscriptions.telegram.$.role_mentions': data.role_mentions ?? null
            }
        }
    )

    if (tgSubscription.notification_channel_id !== data.notification_channel_id) {
        try {
            await DiscordUtils.rest.patch(DiscordUtils.restRoutes.webhook(tgSubscription.webhook_id), {
                body: {
                    channel_id: data.notification_channel_id
                }
            })
        } catch (err) {
            await Logger.handleError({
                module: 'TelegramSubs',
                action: 'UpdateWebhook',
                error: err,
                guild_id: server._id
            })
        }
    }

    ctx.status = 200
    ctx.body = data
}
