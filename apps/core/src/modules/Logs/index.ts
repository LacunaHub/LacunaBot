import DiscordUtils from '@/api/utility/DiscordUtils.js'
import { type ServerDocument, type ServerModerationLogsTypeKey } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { bufferToDataURL, fetchFile } from '@/internals/utility/Utils.js'
import { type APIWebhook, Guild, MessagePayload, WebhookClient, type WebhookMessageCreateOptions } from 'discord.js'
import ChannelCreate from './Channel/ChannelCreate.js'
import ChannelDelete from './Channel/ChannelDelete.js'
import ChannelUpdate from './Channel/ChannelUpdate.js'
import EmojiCreate from './Emoji/EmojiCreate.js'
import EmojiDelete from './Emoji/EmojiDelete.js'
import EmojiUpdate from './Emoji/EmojiUpdate.js'
import GuildBanAdd from './Guild/GuildBanAdd.js'
import GuildBanRemove from './Guild/GuildBanRemove.js'
import GuildMemberAdd from './Guild/GuildMemberAdd.js'
import GuildMemberRemove from './Guild/GuildMemberRemove.js'
import GuildMemberRoleAdd from './Guild/GuildMemberRoleAdd.js'
import GuildMemberRoleRemove from './Guild/GuildMemberRoleRemove.js'
import GuildMemberUpdate from './Guild/GuildMemberUpdate.js'
import GuildUpdate from './Guild/GuildUpdate.js'
import InviteCreate from './Guild/InviteCreate.js'
import InviteDelete from './Guild/InviteDelete.js'
import MessageDelete from './Message/MessageDelete.js'
import MessageDeleteBulk from './Message/MessageDeleteBulk.js'
import MessageUpdate from './Message/MessageUpdate.js'
import RoleCreate from './Role/RoleCreate.js'
import RoleDelete from './Role/RoleDelete.js'
import RoleUpdate from './Role/RoleUpdate.js'
import StickerCreate from './Sticker/StickerCreate.js'
import StickerDelete from './Sticker/StickerDelete.js'
import StickerUpdate from './Sticker/StickerUpdate.js'
import ThreadCreate from './Thread/ThreadCreate.js'
import ThreadDelete from './Thread/ThreadDelete.js'
import ThreadUpdate from './Thread/ThreadUpdate.js'
import UserUpdate from './User/UserUpdate.js'
import VoiceConnect from './Voice/VoiceConnect.js'
import VoiceDisconnect from './Voice/VoiceDisconnect.js'
import VoiceMove from './Voice/VoiceMove.js'
import VoiceServerDeaf from './Voice/VoiceServerDeaf.js'
import VoiceServerMute from './Voice/VoiceServerMute.js'
import VoiceServerUndeaf from './Voice/VoiceServerUndeaf.js'
import VoiceServerUnmute from './Voice/VoiceServerUnmute.js'

const rateLimitCache = new Map()

export async function sendLog(
    self: Lacuna,
    server: ServerDocument,
    channelId: string,
    message: MessagePayload | WebhookMessageCreateOptions
) {
    const channelWebhook = server.moderation.logs.webhooks.find(i => i.channel_id === channelId)
    let webhook!: WebhookClient

    if (channelWebhook) {
        webhook = new WebhookClient({ id: channelWebhook.id, token: channelWebhook.token })
    }

    if (typeof webhook === 'undefined') {
        try {
            const avatarFile = await fetchFile(self.user!.displayAvatarURL())

            const createdWebhook = (await self.rest.post(DiscordUtils.restRoutes.channelWebhooks(channelId), {
                body: {
                    name: self.user!.username,
                    avatar: bufferToDataURL(avatarFile.data, avatarFile.mimeType!)
                },
                headers: {
                    'X-Audit-Log-Reason': 'Logs: No webhook for the logs'
                }
            })) as APIWebhook

            await self.db.servers.updateOne(
                { _id: server._id },
                {
                    $push: {
                        'moderation.logs.webhooks': {
                            id: createdWebhook.id,
                            token: createdWebhook.token,
                            channel_id: createdWebhook.channel_id
                        }
                    }
                }
            )

            webhook = new WebhookClient({ id: createdWebhook.id, token: createdWebhook.token! })
        } catch (err: any) {
            self.logger.error({ module: 'Logs', action: 'CreateWebhook', err, guildId: server._id })

            // Disable logs that uses the specified channelId when this error occurs:
            // Maximum number of webhooks reached (15)
            // Maximum number of webhooks per guild reached (1000)
            if (err?.code === 30007 || err?.code === 30058) {
                const eventsWithThisChannelId = Object.keys(server.moderation.logs.types).filter(
                    v => (server.moderation.logs.types as any)[v].channel_id === channelId
                ) as ServerModerationLogsTypeKey[]

                if (eventsWithThisChannelId.length > 0) {
                    await self.db.servers.updateOne(
                        { _id: server._id },
                        {
                            $set: Object.assign(
                                {},
                                ...eventsWithThisChannelId.map(v => {
                                    return {
                                        [`moderation.logs.types.${v}.active`]: false,
                                        [`moderation.logs.types.${v}.channel_id`]: null
                                    }
                                })
                            )
                        }
                    )
                }
            }

            return null
        }
    }

    try {
        return await webhook.send(message)
    } catch (err: any) {
        // Unknown Webhook
        // See https://github.com/LacunaHub/LacunaBot/issues/190
        if (err?.code === 10015) {
            await self.db.servers.updateOne(
                { _id: server._id },
                {
                    $pull: {
                        'moderation.logs.webhooks': {
                            channel_id: channelId
                        }
                    }
                }
            )
        }
    }

    return null
}

export function isRateLimited(guildId: string, premium: boolean) {
    let rateLimit: { resetAfter: number; remaining: number } | undefined = rateLimitCache.get(guildId)

    if (rateLimit && Date.now() > rateLimit.resetAfter) {
        rateLimitCache.delete(guildId)
        rateLimit = undefined
    }

    if (!rateLimit) {
        rateLimit = rateLimitCache
            .set(guildId, { resetAfter: Date.now() + 1000 * 60, remaining: premium ? 19 : 4 })
            .get(guildId)

        return false
    }

    if (rateLimit.remaining <= 0) return true

    rateLimit.remaining--

    return false
}

export default {
    ChannelCreate,
    ChannelDelete,
    ChannelUpdate,
    EmojiCreate,
    EmojiDelete,
    EmojiUpdate,
    GuildBanAdd,
    GuildBanRemove,
    GuildMemberAdd,
    GuildMemberRemove,
    GuildMemberUpdate,
    GuildUpdate,
    InviteCreate,
    InviteDelete,
    MessageDelete,
    MessageDeleteBulk,
    MessageUpdate,
    RoleCreate,
    RoleDelete,
    GuildMemberRoleAdd,
    GuildMemberRoleRemove,
    RoleUpdate,
    StickerCreate,
    StickerDelete,
    StickerUpdate,
    ThreadCreate,
    ThreadDelete,
    ThreadUpdate,
    UserUpdate,
    VoiceConnect,
    VoiceDisconnect,
    VoiceMove,
    VoiceServerDeaf,
    VoiceServerMute,
    VoiceServerUndeaf,
    VoiceServerUnmute
}

export interface LogEventData {
    guild: Guild
}
