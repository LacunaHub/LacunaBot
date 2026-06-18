import APIError from '@/api/utility/APIError.js'
import DiscordUtils from '@/api/utility/DiscordUtils.js'
import database from '@/database/index.js'
import { type ServerDocument } from '@/database/schemas/Servers.js'
import { type Context } from 'koa'

export default async function deleteTelegramSubscription(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const channelId: number = +ctx.params.channelId

    const tgSubscription = server.modules.subscriptions.telegram.find(v => v.channel_id === channelId)
    if (!tgSubscription) ctx.throw(404, new APIError(1014))

    await database.servers.updateOne(
        { _id: server._id },
        {
            $pull: {
                'modules.subscriptions.telegram': {
                    channel_id: tgSubscription.channel_id
                }
            }
        }
    )

    const subscribedGuilds = await database.servers.find({
        'modules.subscriptions.telegram.channel_id': tgSubscription.channel_id
    })

    if (!subscribedGuilds.length) {
        await database.telegramSubs.deleteOne({ _id: tgSubscription.channel_id })
    }

    if (tgSubscription.webhook_id) {
        try {
            await DiscordUtils.rest.delete(
                DiscordUtils.restRoutes.webhook(tgSubscription.webhook_id, tgSubscription.webhook_token)
            )
        } catch (err) {
            ctx.log.error({
                module: 'TelegramSubs',
                action: 'DeleteWebhook',
                err,
                guildId: server._id
            })
        }
    }

    ctx.status = 204
}
