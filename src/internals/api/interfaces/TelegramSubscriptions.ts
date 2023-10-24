import { APIWebhook, DataResolver } from 'discord.js'
import database from '../../../database'
import { ServerDocument } from '../../../database/schemas/Servers'
import { IFile } from '../../../modules/Telegram'
import Logger from '../../Logger'
import DiscordUtils from '../../utility/DiscordUtils'
import APIError from '../utility/APIError'

export async function createTelegramSubscription(server: ServerDocument, data: any) {
    const subscriptions = server.modules.subscriptions.telegram

    if (subscriptions.length >= 1 && !server.server.premium.available) throw new APIError(3007)
    if (subscriptions.length >= 10) throw new APIError(3008)
    if (subscriptions.some(s => s.channel_id === data.channel.id)) throw new APIError(2005)

    let webhook: APIWebhook, channelPhoto: Buffer

    try {
        if (data.channel.photo_file_id) {
            const getFileResponse = await fetch(
                `https://api.telegram.org/bot${process.env.TELEGRAM_PUBLIC_BOT_TOKEN}/getFile?file_id=${data.channel.photo_file_id}`
            )

            if (getFileResponse.ok) {
                const file: IFile = (await getFileResponse.json()).result
                const downloadFileResponse = await fetch(
                    `https://api.telegram.org/file/bot${process.env.TELEGRAM_PUBLIC_BOT_TOKEN}/${file.file_path}`
                )

                if (downloadFileResponse.ok) {
                    const arrayBuffer = await downloadFileResponse.arrayBuffer()
                    channelPhoto = Buffer.from(arrayBuffer)
                }
            }
        }

        webhook = (await DiscordUtils.restApi.post(DiscordUtils.apiRoutes.channelWebhooks(data.notification_channel_id), {
            body: {
                name: data.channel.name,
                avatar: await DataResolver.resolveImage(channelPhoto)
            }
        })) as any
    } catch (err) {
        await Logger.handleError({
            module: 'TelegramSubs',
            action: 'CreateWebhook',
            error: err,
            guild_id: server._id
        })

        throw new APIError(5009)
    }

    const telegramSub = await database.telegramSubs.findOne({ _id: data.channel.id })

    if (!telegramSub) {
        await database.telegramSubs.create({
            _id: data.channel.id,
            channel_title: data.channel.name,
            channel_username: data.channel.username
        })
    }

    const subscription = {
        channel_id: data.channel.id,
        channel_name: data.channel.name,
        channel_username: data.channel.username,
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

    return subscription
}

export async function updateTelegramSubscription(server: ServerDocument, data: any) {
    const subscription = server.modules.subscriptions.telegram.find(i => i.channel_id === data.channel_id)

    if (!subscription) throw new APIError(1014)

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

    if (subscription.notification_channel_id !== data.notification_channel_id) {
        try {
            await DiscordUtils.restApi.patch(DiscordUtils.apiRoutes.webhook(subscription.webhook_id), {
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

    return data
}

export async function deleteTelegramSubscription(server: ServerDocument, data: any) {
    const subscription = server.modules.subscriptions.telegram.find(s => s.channel_id === data.channel_id)

    if (!subscription) throw new APIError(1014)

    await database.servers.updateOne(
        { _id: server._id },
        {
            $pull: {
                'modules.subscriptions.telegram': {
                    channel_id: subscription.channel_id
                }
            }
        }
    )

    const subscribedGuilds = await database.servers.find({ 'modules.subscriptions.telegram.channel_id': subscription.channel_id })

    if (!subscribedGuilds.length) {
        await database.telegramSubs.deleteOne({ _id: subscription.channel_id })
    }

    if (subscription.webhook_id) {
        try {
            await DiscordUtils.restApi.delete(DiscordUtils.apiRoutes.webhook(subscription.webhook_id, subscription.webhook_token))
        } catch (err) {
            await Logger.handleError({
                module: 'TelegramSubs',
                action: 'DeleteWebhook',
                error: err,
                guild_id: server._id
            })
        }
    }

    return true
}
