import { ServerDocument, ServerModerationLogsTypeKey } from '@lacunahub/lacuna-database-driver'
import { APIWebhook, DataResolver, MessagePayload, WebhookMessageCreateOptions } from 'discord.js'
import DiscordUtils from '../../api/utility/DiscordUtils'
import Lacuna from '../../internals/Lacuna'
import { Webhook } from '../../internals/structures/Webhook'
import ChannelCreate from './Channel/ChannelCreate'
import ChannelDelete from './Channel/ChannelDelete'
import ChannelUpdate from './Channel/ChannelUpdate'
import EmojiCreate from './Emoji/EmojiCreate'
import EmojiDelete from './Emoji/EmojiDelete'
import EmojiUpdate from './Emoji/EmojiUpdate'
import GuildBanAdd from './Guild/GuildBanAdd'
import GuildBanRemove from './Guild/GuildBanRemove'
import GuildMemberAdd from './Guild/GuildMemberAdd'
import GuildMemberRemove from './Guild/GuildMemberRemove'
import GuildMemberUpdate from './Guild/GuildMemberUpdate'
import GuildUpdate from './Guild/GuildUpdate'
import InviteCreate from './Guild/InviteCreate'
import InviteDelete from './Guild/InviteDelete'
import MessageDelete from './Message/MessageDelete'
import MessageDeleteBulk from './Message/MessageDeleteBulk'
import MessageUpdate from './Message/MessageUpdate'
import RoleCreate from './Role/RoleCreate'
import RoleDelete from './Role/RoleDelete'
import RoleMemberAdd from './Role/RoleMemberAdd'
import RoleMemberRemove from './Role/RoleMemberRemove'
import RoleUpdate from './Role/RoleUpdate'
import StickerCreate from './Sticker/StickerCreate'
import StickerDelete from './Sticker/StickerDelete'
import StickerUpdate from './Sticker/StickerUpdate'
import ThreadCreate from './Thread/ThreadCreate'
import ThreadDelete from './Thread/ThreadDelete'
import ThreadUpdate from './Thread/ThreadUpdate'
import UserUpdate from './User/UserUpdate'
import VoiceConnect from './Voice/VoiceConnect'
import VoiceDisconnect from './Voice/VoiceDisconnect'
import VoiceMove from './Voice/VoiceMove'
import VoiceServerDeaf from './Voice/VoiceServerDeaf'
import VoiceServerMute from './Voice/VoiceServerMute'
import VoiceServerUndeaf from './Voice/VoiceServerUndeaf'
import VoiceServerUnmute from './Voice/VoiceServerUnmute'

const rateLimitCache = new Map()

export async function sendLog(self: Lacuna, server: ServerDocument, channelId: string, message: MessagePayload | WebhookMessageCreateOptions) {
    const channelWebhook = server.moderation.logs.webhooks.find(i => i.channel_id === channelId)
    let webhook: Webhook

    if (channelWebhook) {
        webhook = new Webhook({ id: channelWebhook.id, token: channelWebhook.token })
    }

    if (typeof webhook === 'undefined') {
        try {
            const createdWebhook = (await self.rest.post(DiscordUtils.restRoutes.channelWebhooks(channelId), {
                body: {
                    name: self.user.username,
                    avatar: await DataResolver.resolveImage(self.user.displayAvatarURL())
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

            webhook = new Webhook({ id: createdWebhook.id, token: createdWebhook.token })
        } catch (err) {
            await self.logger.handleError({ module: 'Logs', action: 'CreateWebhook', error: err, guild_id: server._id })

            // Disable logs that uses the specified channelId when this error occurs:
            // Maximum number of webhooks reached (15)
            // Maximum number of webhooks per guild reached (1000)
            if (err?.code === 30007 || err?.code === 30058) {
                const eventsWithThisChannelId = Object.keys(server.moderation.logs.types).filter(
                    (v: ServerModerationLogsTypeKey) => server.moderation.logs.types[v].channel_id === channelId
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
    } catch (err) {
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
    let rateLimit: { resetAfter: number; remaining: number } = rateLimitCache.get(guildId)

    if (rateLimit && Date.now() > rateLimit.resetAfter) {
        rateLimitCache.delete(guildId)
        rateLimit = undefined
    }

    if (!rateLimit) {
        rateLimit = rateLimitCache.set(guildId, { resetAfter: Date.now() + 1000 * 60, remaining: premium ? 19 : 4 }).get(guildId)

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
    RoleMemberAdd,
    RoleMemberRemove,
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
