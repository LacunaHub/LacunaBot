import { ServerDocument } from '@/database/schemas/Servers'
import { APIWebhook, resolveImage } from 'discord.js'
import { Context } from 'koa'
import fetch from 'node-fetch'
import database from '../../../../../database'
import { TelegramFile } from '../../../../modules/social-alerts/TelegramAlerts'
import APIError from '../../../../utility/APIError'
import DiscordUtils from '../../../../utility/DiscordUtils'

export default async function createTelegramSubscription(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const data = ctx.request.body

    if (server.modules.subscriptions.telegram.length >= 1 && !server.premium.available) ctx.throw(402, new APIError(3007))
    if (server.modules.subscriptions.telegram.length >= 10) ctx.throw(406, new APIError(3008))
    if (server.modules.subscriptions.telegram.some(v => v.channel_id === data.channel.id)) ctx.throw(409, new APIError(2005))

    let webhook: APIWebhook, channelPhoto: Buffer
    const tgChannel = {
        id: data.channel.id,
        title: data.channel.name ?? String(data.channel.id),
        username: data.channel.username ?? data.channel.name ?? String(data.channel.id),
        photo_file_id: data.channel.photo_file_id
    }

    try {
        if (tgChannel.photo_file_id) {
            const getFileResponse = await fetch(
                `https://api.telegram.org/bot${process.env.LCN_TELEGRAM_PUBLIC_BOT_TOKEN}/getFile?file_id=${tgChannel.photo_file_id}`
            )

            if (getFileResponse.ok) {
                const file: TelegramFile = (await getFileResponse.json()).result
                const downloadFileResponse = await fetch(
                    `https://api.telegram.org/file/bot${process.env.LCN_TELEGRAM_PUBLIC_BOT_TOKEN}/${file.file_path}`
                )

                if (downloadFileResponse.ok) {
                    const arrayBuffer = await downloadFileResponse.arrayBuffer()
                    channelPhoto = Buffer.from(arrayBuffer)
                }
            }
        }

        webhook = (await DiscordUtils.rest.post(DiscordUtils.restRoutes.channelWebhooks(data.notification_channel_id), {
            body: {
                name: tgChannel.title,
                avatar: await resolveImage(channelPhoto)
            }
        })) as any
    } catch (err) {
        ctx.log.error({
            module: 'TelegramSubs',
            action: 'CreateWebhook',
            err,
            guildId: server._id
        })

        ctx.throw(500, new APIError(5009))
    }

    const telegramSub = await database.telegramSubs.findOne({ _id: data.channel.id })
    if (!telegramSub) {
        await database.telegramSubs.create({
            _id: tgChannel.id,
            channel_title: tgChannel.title,
            channel_username: tgChannel.username
        })
    }

    const subscription = {
        channel_id: tgChannel.id,
        channel_name: tgChannel.title,
        channel_username: tgChannel.username,
        notification_channel_id: data.notification_channel_id,
        webhook_id: webhook?.id ?? null,
        webhook_token: webhook?.token ?? null,
        options: data.options
    }

    await database.servers.updateOne(
        { _id: server._id },
        {
            $push: {
                'modules.subscriptions.telegram': subscription
            }
        }
    )

    ctx.status = 200
    ctx.body = subscription
}
