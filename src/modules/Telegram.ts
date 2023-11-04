import { AttachmentBuilder, MessagePayload, makeURLSearchParams } from 'discord.js'
import fetch from 'node-fetch'
import database from '../database'
import { handleModuleExecutionData } from '../events/system/ModuleExecution'
import Logger from '../internals/Logger'
import { apiRoutes, restApi } from '../internals/utility/DiscordUtils'
import { truncateString } from '../internals/utility/Utils'

const telegramBaseApiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_PUBLIC_BOT_TOKEN}`
const [telegramBotId] = process.env.TELEGRAM_PUBLIC_BOT_TOKEN.split(':')

export async function searchChannels(query: string) {
    if (isNaN(query as any)) {
        query = query.startsWith('@') ? query : `@${query}`
    }

    try {
        const getChatResponse = await fetch(`${telegramBaseApiUrl}/getChat?chat_id=${query}`)

        if (getChatResponse.ok) {
            const chat: IChat = (await getChatResponse.json()).result

            if (chat.type !== 'channel') return null

            const getChatMemberResponse = await fetch(`${telegramBaseApiUrl}/getChatMember?chat_id=${chat.id}&user_id=${telegramBotId}`)

            if (getChatMemberResponse.ok) {
                const member: IChatMemberAdministrator = (await getChatMemberResponse.json()).result

                if (member.status !== 'administrator') return null

                return {
                    id: chat.id,
                    name: chat.title,
                    username: chat.username,
                    photo_file_id: chat.photo?.big_file_id ?? null
                }
            }
        }
    } catch (err) {}

    return null
}

export async function handleTelegramWebhook(data: ITelegramWebhookData) {
    const subscription = await database.telegramSubs.findOne({ _id: data.channel_id })

    if (!subscription) {
        Logger.log(`[Telegram] Database entry for subscription "${data.channel_id}" not found`)

        return
    }

    await database.telegramSubs.updateOne({ _id: data.channel_id }, { $set: { last_message_id: data.message_id } })

    Logger.info(`[Telegram] Handling incoming webhook from subscription "${data.channel_id}"`)

    const subscribedGuilds = await database.servers.find({ 'modules.subscriptions.telegram.channel_id': data.channel_id })

    if (!subscribedGuilds.length) {
        Logger.log(`[Telegram] No subscribed guilds found for subscription "${data.channel_id}"`)

        await database.telegramSubs.deleteOne({ _id: data.channel_id })

        return
    }

    Logger.log(`[Telegram] Sending notifications about video "${data.message_id}" to guilds ${subscribedGuilds.map(i => i._id).join(',')}`)

    for (const guild of subscribedGuilds) {
        const guildSubscription = guild.modules.subscriptions.telegram
            .slice(0, guild.server.premium.available ? 10 : 1)
            .find(i => i.channel_id === data.channel_id)

        if (!guildSubscription) continue

        let webhook: any

        try {
            webhook = await restApi.get(apiRoutes.webhook(guildSubscription.webhook_id, guildSubscription.webhook_token))
        } catch (err) {
            Logger.handleError({
                module: 'Telegram',
                action: 'GetWebhook',
                error: err,
                guild_id: guild._id
            })
        }

        if (!webhook) {
            try {
                webhook = await restApi.post(apiRoutes.channelWebhooks(guildSubscription.notification_channel_id), {
                    body: {
                        name: `@${data.channel_username}`
                    }
                })
            } catch (err) {
                Logger.handleError({
                    module: 'Telegram',
                    action: 'CreateWebhook',
                    error: err,
                    guild_id: guild._id
                })
            }

            if (webhook)
                await database.servers.updateOne(
                    { _id: guild._id, 'modules.subscriptions.telegram.channel_id': data.channel_id },
                    {
                        $set: {
                            'modules.subscriptions.telegram.$.webhook_id': webhook.id,
                            'modules.subscriptions.telegram.$.webhook_token': webhook.token
                        }
                    }
                )
            else continue
        }

        const mentions = []

        if (guildSubscription.options.includes('MENTION_EVERYONE')) {
            mentions.push('@everyone')
        }

        if (guildSubscription.options.includes('MENTION_ROLES')) {
            mentions.push(...(guildSubscription.role_mentions ?? []).map(i => `<@&${i}>`))
        }

        let content = truncateString(data.text ?? '', 1600, `[...](<${data.post_link}>)`)

        if (mentions.length) {
            content += `\n\n${mentions.join(' ')}`
        }

        const files = data.file
            ? [await MessagePayload.resolveFile(new AttachmentBuilder(Buffer.from(data.file.buffer.data), { name: `file.${data.file.type.ext}` }))]
            : []

        if (!data.text && !files) content += `\n${data.post_link}`

        try {
            const message: any = await restApi.post(apiRoutes.webhook(webhook.id, webhook.token), {
                body: {
                    content
                },
                files,
                query: makeURLSearchParams({ wait: true })
            })

            if (guildSubscription.options.includes('CROSSPOST_MESSAGE')) {
                await restApi.post(apiRoutes.channelMessageCrosspost(message.channel_id, message.id))
            }
        } catch (err) {
            Logger.handleError({
                module: 'Telegram',
                action: 'SendNotificationMessage',
                error: err,
                guild_id: guild._id
            })
        }

        handleModuleExecutionData({
            module: 'Telegram',
            category: 'SendNotification',
            guild: { id: guild._id, name: 'Unknown' },
            target: { id: guildSubscription.channel_id.toString(), name: guildSubscription.channel_name }
        })
    }
}

export interface IChat {
    id: number
    type: 'private' | 'group' | 'supergroup' | 'channel'
    title?: string
    username?: string
    first_name?: string
    last_name?: string
    is_forum?: boolean
    photo?: IChatPhoto
    active_usernames?: string[]
    emoji_status_custom_emoji_id?: string
    bio?: string
    has_private_forwards?: boolean
    has_restricted_voice_and_video_messages?: boolean
    join_to_send_messages?: boolean
    join_by_request?: boolean
    description?: string
    invite_link?: string
    pinned_message?: any
    permissions?: any
    slow_mode_delay?: number
    message_auto_delete_time?: number
    has_aggressive_anti_spam_enabled?: number
    has_hidden_members?: boolean
    has_protected_content?: boolean
    sticker_set_name?: string
    can_set_sticker_set?: string
    linked_chat_id?: number
    location?: any
}

export interface IChatPhoto {
    small_file_id: string
    small_file_unique_id: string
    big_file_id: string
    big_file_unique_id: string
}

export interface IChatMemberAdministrator {
    status: 'administrator'
    user: any
    can_be_edited: boolean
    is_anonymous: boolean
    can_manage_chat: boolean
    can_delete_messages: boolean
    can_manage_video_chats: boolean
    can_restrict_members: boolean
    can_promote_members: boolean
    can_change_info: boolean
    can_invite_users: boolean
    can_post_messages?: boolean
    can_edit_messages?: boolean
    can_pin_messages?: boolean
    can_manage_topics?: boolean
    custom_title?: string
}

export interface IFile {
    file_id: string
    file_unique_id: string
    file_size?: number
    file_path?: string
}

export interface ITelegramWebhookData {
    message_id: number
    channel_id: number
    channel_title: string
    channel_username?: string
    date: number
    text?: string
    poll?: any
    file: {
        type: { ext: string; mime: string }
        buffer: {
            type: 'Buffer'
            data: number[]
        }
    }
    post_link: string
}
