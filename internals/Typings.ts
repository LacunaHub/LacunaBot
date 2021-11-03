import { ApplicationCommandOptionData } from 'discord.js'
import { Document } from 'mongoose'

export interface ServerDocument extends Document {
    _id: string
    locale: 'en' | 'ru'
    prefix: string
    server: {
        premium: {
            available: boolean
            will_expire_on: number
            booster_id?: string
        }
        blocked: boolean
        bot_experts: BotExpert[]
    }
    commands: {
        system: Array<SystemCommandOptions>
        custom: Array<CustomCommand>
        permissions: {
            allowed: {
                channels: Array<string>
                roles: Array<string>
            }
            blocked: {
                channels: Array<string>
                roles: Array<string>
            }
        }
        slash_commands: boolean
    }
    moderation: {
        case_log: {
            cases: Array<ModerationCase>
            channel_id: string
            case_types: {
                BAN_ADD: boolean
                BAN_REMOVE: boolean
                KICK: boolean
                MUTE_ADD: boolean
                MUTE_REMOVE: boolean
                PRUNE_MESSAGES: boolean
                WARN_ADD: boolean
                WARN_REMOVE: boolean
            }
        }
        logs: {
            webhooks: Array<LogsWebhook>
            types: {
                channel_create: {
                    active: boolean
                    channel_id: string
                }
                channel_delete: {
                    active: boolean
                    channel_id: string
                }
                channel_update: {
                    active: boolean
                    channel_id: string
                }
                guild_ban_add: {
                    active: boolean
                    channel_id: string
                }
                guild_ban_remove: {
                    active: boolean
                    channel_id: string
                }
                guild_member_add: {
                    active: boolean
                    channel_id: string
                }
                guild_member_remove: {
                    active: boolean
                    channel_id: string
                }
                guild_member_update: {
                    active: boolean
                    channel_id: string
                }
                guild_update: {
                    active: boolean
                    channel_id: string
                }
                invite_create: {
                    active: boolean
                    channel_id: string
                }
                invite_delete: {
                    active: boolean
                    channel_id: string
                }
                message_delete: {
                    active: boolean
                    channel_id: string
                }
                message_delete_bulk: {
                    active: boolean
                    channel_id: string
                }
                message_update: {
                    active: boolean
                    channel_id: string
                }
                role_create: {
                    active: boolean,
                    channel_id: string
                }
                role_delete: {
                    active: boolean
                    channel_id: string
                }
                role_member_add: {
                    active: boolean
                    channel_id: string
                }
                role_member_remove: {
                    active: boolean
                    channel_id: string
                }
                role_update: {
                    active: boolean
                    channel_id: string
                }
                user_update: {
                    active: boolean
                    channel_id: string
                }
                voice_connect: {
                    active: boolean
                    channel_id: string
                }
                voice_disconnect: {
                    active: boolean
                    channel_id: string
                }
                voice_move: {
                    active: boolean
                    channel_id: string
                }
                voice_server_mute: {
                    active: boolean
                    channel_id: string
                }
                voice_server_unmute: {
                    active: boolean
                    channel_id: string
                }
                voice_server_deaf: {
                    active: boolean
                    channel_id: string
                }
                voice_server_undeaf: {
                    active: boolean
                    channel_id: string
                }
            }
        }
        automoder: {
            swear_filter: {
                active: boolean
                registry: Array<string>
                penalty: {
                    action: number
                    timer: number
                    message: {
                        content: string
                        embed: MessageEmbed
                    }
                    add_roles: string[]
                    remove_roles: string[]
                },
                ignored: {
                    channels: string[]
                    roles: string[]
                    permissions: number
                }
            }
            links_filter: {
                active: boolean
                registry: string[]
                allowed_registry: string[]
                delete_all_links: boolean
                delete_referral_invites: boolean
                penalty: {
                    action: number
                    timer: number
                    message: {
                        content: string
                        embed: MessageEmbed
                    }
                    add_roles: string[]
                    remove_roles: string[]
                },
                ignored: {
                    channels: string[]
                    roles: string[]
                    permissions: number
                }
            }
            users_slowdown: {
                active: boolean
                messages_limit: number
                penalty: {
                    action: number
                    timer: number
                    message: {
                        content: string
                        embed: MessageEmbed
                    }
                    add_roles: string[]
                    remove_roles: string[]
                },
                ignored: {
                    channels: string[]
                    roles: string[]
                    permissions: number
                }
            }
            anti_caps: {
                active: boolean
                percentage_of_caps: number
                minimum_content_length: number
                penalty: {
                    action: number
                    timer: number
                    message: {
                        content: string
                        embed: MessageEmbed
                    }
                    add_roles: string[]
                    remove_roles: string[]
                },
                ignored: {
                    channels: string[]
                    roles: string[]
                    permissions: number
                }
            }
            nicknames: {
                active: boolean
                types: {
                    special_characters: boolean
                    zalgo: boolean
                    diacritics: boolean
                    emojis: boolean
                    regexp: {
                        pattern: string
                        flags: string[]
                    }
                    contains: string[]
                }
                ignored: {
                    roles: string[]
                    permissions: number
                }
            }
        }
        warnings: {
            penalties: Array<WarningsPenalty>
            violators: Array<WarningsViolator>
        },
        roles: {
            mute: string
            temporary: Array<TemporaryRoleEntry>
            on_mute: {
                remove_all_roles: boolean
                strict_roles: string[]
                returnable_roles: Array<{ user_id: string, roles: string[] }>
            }
        },
        tempbans: Array<TemporaryBanEntry>
        tempmutes: Array<TemporaryMuteEntry>
    }
    modules: {
        welcome: {
            active: boolean
            format: 'DM' | 'CHANNEL'
            channel_id: string
            message: {
                content: string
                embed: MessageEmbed
            }
            initial_roles: {
                active: boolean
                roles: Array<string>
            }
        },
        farewell: {
            active: boolean
            format: 'DM' | 'CHANNEL'
            channel_id: string
            message: {
                content: string
                embed: MessageEmbed
            }
        },
        reactions: Array<ReactionElement>
        levels: {
            active: boolean
            voice: boolean
            single_roles?: boolean
            reset_on_leave: boolean
            blocked: {
                channels: Array<string>
                roles: Array<string>
            },
            allowed: {
                channels: Array<string>
                roles: Array<string>
            },
            level_up_alerts: {
                active: boolean
                format: 'DM' | 'CHANNEL' | 'CURRENT_CHANNEL'
                channel_id: string
                message: {
                    content: string
                    embed: MessageEmbed
                }
            },
            awards: Array<LevelAward>
        },
        voice_manager: {
            voice_roles: Array<VoiceRole>
            temp_voice_channels: {
                triggers: Array<VoiceChannelTrigger>
            }
        },
        restoring: {
            restore_roles: boolean
            restore_nicknames: boolean
            strict_roles: Array<string>
            data: Array<RestoringData>
        }
        music: {
            allowed: {
                channels: Array<string>
                roles: Array<string>
            }
            blocked: {
                channels: Array<string>
                roles: Array<string>
            }
            queue_max_length: number
            track_max_duration: number
            default_volume: number
            allow_radio_playback: boolean
            disable_skip_vote: boolean
        }
        reports: {
            active: boolean
            channel_id: string
            emoji: {
                animated: boolean
                id: string
                name: string
            }
            minimum: number
        }
        twitch: {
            custom_client_id: string
            channels: TwitchChannel[]
        }
        youtube: {
            custom_api_key: string
            channels: YouTubeChannel[]
        }
        autoreactions: AutoReaction[]
    }
    utility: {
        giveaways: Array<Giveaway>
    }
    created_at: number
    modified_at: number
    activity_ping_at: number
}

export interface SystemCommandOptions {
    name: string
    inactive: boolean
    throttle: {
        type: 'PER_GUILD' | 'PER_CHANNEL' | 'PER_USER'
        uses: number
        duration: number
    }
    delete_command: {
        active: boolean
        after_ms: number
    }
    delete_reply: {
        active: boolean
        after_ms: number
    }
    allowed: {
        channels: Array<string>
        roles: Array<string>
    }
    blocked: {
        channels: Array<string>
        roles: Array<string>
    }
}

export interface CustomCommand {
    name: string
    description: string
    type: 'USUAL' | 'TAG'
    inactive: boolean
    hidden: boolean
    components: CustomCommandComponent[]
    allowed: {
        channels: Array<string>
        roles: Array<string>
    }
    blocked: {
        channels: Array<string>
        roles: Array<string>
    }
    throttle: {
        type: 'NONE' | 'PER_GUILD' | 'PER_CHANNEL' | 'PER_USER'
        max_uses: number
        duration: number
    }
}

export interface CustomCommandComponent {
    type: 'CONDITION' | 'ACTION'
    condition?: CustomCommandCondition
    action?: CustomCommandAction
}

export interface CustomCommandCondition {
    type: 'IF_ELSE' | 'COMPARE' | 'USER'
    if_else?: {
        condition: CustomCommandConditionIfElse
        actions: Partial<CustomCommandComponent>[]
    }
    compare?: {
        operator: '==' | '!=' | '>' | '<' | '^' | '$' | '~' | '!~'
        left: string
        right: string
    }
    roles?: {
        condition: 'HAS' | 'MISSING'
        values: string[]
    }
    user?: {
        condition: 'HAS_PERMISSIONS' | 'MISSING_PERMISSIONS' | 'HAS_ROLES' | 'MISSING_ROLES'
        permissions?: string[]
        roles?: string[]
    }
}

export interface CustomCommandConditionIfElse {
    type: 'COMPARE' | 'USER'
    compare?: {
        operator: '==' | '!=' | '>' | '<' | '^' | '$' | '~' | '!~'
        left: string
        right: string
    }
    roles?: {
        condition: 'HAS' | 'MISSING'
        values: string[]
    }
    user?: {
        condition: 'HAS_PERMISSIONS' | 'MISSING_PERMISSIONS' | 'HAS_ROLES' | 'MISSING_ROLES'
        permissions?: string[]
        roles?: string[]
    }
}

export interface CustomCommandAction {
    type: 'REPLY' | 'MODIFY_ROLES' | 'ADD_REACTIONS' | 'DELETE_REQUEST' | 'FORWARD_TO_COMMAND'
    reply?: CustomCommandActionReply
    modify_roles?: {
        add: string[]
        remove: string[]
    }
    add_reactions?: string[]
    delete_request?: number
    forward_to_command?: string
}

export interface CustomCommandActionReply {
    format: 'CHANNEL' | 'CURRENT_CHANNEL'
    channel_id: string
    message: {
        content: string
        embed: MessageEmbed
        tts: boolean
    }
    delete: number
}

export interface ModerationCase {
    case_id: number
    type: number
    timestamp: number
    reason: string
    target: {
        id: string
        name: string
    }
    executor: {
        id: string
        name: string
    }
}

export interface LogsWebhook {
    id: string
    token: string
    channel_id: string
}

export interface WarningsPenalty {
    id: string
    penalties: number
    action: number
    duration: number
    message: {
        content: string
        embed: MessageEmbed
    }
    add_roles: string[]
    remove_roles: string[]
}

export interface WarningsViolator {
    user_id: string
    violations: Array<ViolatorViolation>
}

export interface ViolatorViolation {
    id: string
    timestamp: number
    reason: string
}

export interface TemporaryBanEntry {
    user_id: string
    expires_timestamp: number
}

export interface TemporaryBanConstructor {
    user_id: string
    guild_id: string
    expires_timestamp: number
    reason: string
    init?: boolean
}

export interface TemporaryMuteEntry {
    user_id: string
    role_id: string
    expires_timestamp: number
}

export interface TemporaryMuteConstructor {
    user_id: string
    guild_id: string
    role_id: string
    expires_timestamp: number
    reason: string
    init?: boolean
}

export interface TemporaryRoleEntry {
    user_id: string
    role_id: string
    unique_id: string
    expires_timestamp: number
}

export interface TemporaryRoleConstructor {
    user_id: string
    guild_id: string
    role_id: string
    unique_id: string
    expires_timestamp: number
    init?: boolean
}

export interface ReactionElement {
    id: string
    type: 'CHANNEL' | 'ROLE'
    element: {
        single: boolean
        global_single: boolean
        reverse: boolean
        lifespan: number
    }
    message: {
        id: string
        channel_id: string
    }
    emoji: {
        id: string
        name: string
        animated: boolean
    }
    references: Array<string>
}

export interface LevelAward {
    id: string
    type: 'CHANNEL' | 'ROLE'
    level: number
    single: boolean
    references: string[]
    alert: {
        active: boolean
        format: 'DM' | 'CHANNEL' | 'CURRENT_CHANNEL'
        channel_id: string
        message: {
            content: string
            embed: MessageEmbed
        }
    }
}

export interface VoiceRole {
    role_id: string
    bound_channels_id: Array<string>
}

export interface VoiceChannelTrigger {
    id: string
    channel_id: string
    default: {
        name: string
        limit: number
        permissions: number
        category_id: string
        position: 'TOP' | 'BOTTOM'
    }
    allowed_roles: string[]
    blocked_roles: string[]
    moderator_roles: string[]
    children: Array<VoiceChannelTriggerChildren>
}

interface VoiceChannelTriggerChildren {
    channel_id: string
    owner_id: string
    created_at: number
}

export interface RestoringData {
    user_id: string
    roles: Array<string>
    nickname: string | null
    timestamp: number
}

export interface UserDocument extends Document {
    _id: string
    flags: number
    user: {
        username: string
        discriminator: string
        avatar: string
        flags: number
    },
    profile: {
        name: string
        gender: number
        birth_date: number
        bio: string
        views: number
        upvoters: Array<string>
    }
    boost: {
        available?: boolean
        points: number
        lifetime_points: number
        type?: Array<BoostType>
        tier?: number
        guilds?: Array<BoostedGuild>
    }
    bills: Bill[]
    created_at: number
    modified_at: number
}

export type BoostType = 'DEVELOPER' | 'TEAM' | 'PATREON' | 'BOOSTY' | 'SERVER_BOOST' | 'CUSTOM' | 'GIVEAWAY_WINNER'

export interface BoostedGuild {
    id: string
    timestamp: number
}

export interface CommandInfo {
    prefix(self: import('./Lacuna'), server: ServerDocument, message: import('discord.js').Message): Promise<boolean>
    slash(self: import('./Lacuna'), server: ServerDocument, interaction: import('discord.js').CommandInteraction): Promise<boolean>
    user(self: import('./Lacuna'), server: ServerDocument, interaction: import('discord.js').ContextMenuInteraction): Promise<boolean>
    message(self: import('./Lacuna'), server: ServerDocument, interaction: import('discord.js').ContextMenuInteraction): Promise<boolean>
    name: string
    pretty_name?: string
    description: string
    type: 'CHAT_INPUT' | 'USER' | 'MESSAGE'
    options: ApplicationCommandOptionData[]
    default_permission: boolean
    group?: 'GENERAL' | 'MODERATION' | 'MUSIC' | 'UTILITY'
    subcommands?: Array<{
        prefix(self: import('./Lacuna'), server: import('./Typings').ServerDocument, message: import('discord.js').Message): Promise<boolean>
        slash(self: import('./Lacuna'), server: import('./Typings').ServerDocument, message: import('discord.js').CommandInteraction): Promise<boolean>
        name: string
    }>
    uses: number
    premium_only: boolean
    private: boolean
    throttling?: CommandThrottlingOptions
    throttles?: Map<string, CommandThrottledUser>
    permissions: {
        self: import('discord.js').PermissionResolvable[]
        user: import('discord.js').PermissionResolvable[]
    }
}

interface CommandThrottlingOptions {
    usages: number
    duration: number
}

interface CommandThrottledUser {
    usages: number
    throttled: boolean
    timeout: any
    expires: number
}

export interface CommandExecutionData {
    command: {
        name: string
        uses: number
    },
    message: import('discord.js').Message
    args: Array<string>
}

export interface EventInfo {
    name: string
    handler: Function
    once?: boolean
    initial?: boolean
}

export interface ModuleExecutionData {
    module: string
    guild: {
        id: string
        name: string
    }
    target: {
        id: string
        name: string
    }
}

export interface PlayerQueue {
    tracks: Array<any>
    repeat: boolean
    volume: number
    skip_votes: number
    executor: string
}

export interface Patron extends Document {
    _id: string
    name: string
    user_id: string
    email: string
    discord_id: string
    last_charge_date: string
    will_pay_amount_cents: number
    lifetime_support_cents: number
    patron_status: string
    image_url: string
    last_check_at: number
}

export interface ServerActivities extends Document {
    _id: string
    levels: Array<LevelActivities>
}

export interface LevelActivities {
    user_id: string
    experience: {
        total: number
        current: number
        level: number
    }
    activity: {
        text: {
            total_messages: number
            last_message_at: number
        }
        voice: {
            total_time: number
            connected_at?: number
            disconnected_at?: number
        }
    }
}

export interface Giveaway {
    message_id: string
    channel_id: string
    guild_id: string
    prize: string
    winners_amount: number
    members: string[]
    expiration_date: Date
    locale: string
}

export interface TwitchChannel {
    active: boolean
    live: boolean
    last_check_timestamp: number
    channel: {
        id: string
        display_name: string
        logo: string
    }
    alerts: {
        channel_id: string
        message_template: string
        display_preview: boolean
        after_end: {
            delete_alert: boolean
            message_id: string
        },
        webhook: {
            id: string
            token: string
        }
    }
}

export interface YouTubeChannel {
    active: boolean
    last_video_id: string
    last_check_timestamp: number
    channel: {
        id: string
        name: string
        thumbnail: string
    }
    alerts: {
        channel_id: string
        videos_message_template: string
        broadcasts_message_template: string
        videos: boolean
        broadcasts: boolean
        webhook: {
            id: string
            token: string
        }
    }
}

export interface MessageEmbed {
    active: boolean
    title?: string
    description?: string
    url?: string
    timestamp?: string
    color?: string
    footer: {
        text?: string
        icon_url?: string
    },
    image: {
        url?: string
    },
    thumbnail: {
        url?: string
    },
    author: {
        name?: string
        url?: string
        icon_url?: string
    },
    fields: MessageEmbedFields[]
}

export interface MessageEmbedFields {
    name: string
    value: string
    inline?: boolean
}

export interface AutoReaction {
    channel_id: string
    reactions: Array<{ animated: boolean, id: string, name: string }>
    message_types: string[]
    matches: string[]
    exclude_matches: string[]
}

export interface BotExpert {
    id: string
    expires_timestamp: number
}

export interface Bill {
    bill_id: string
    site_id: string
    amount: {
        value: number
        currency: string
    }
    status: {
        value: 'WAITING' | 'PAID' | 'REJECTED' | 'EXPIRED'
        changed_timestamp: number
    }
    custom_fields: CustomFieldsObject
    customer?: {
        email?: string
        phone?: string
        account?: string
    }
    comment?: string
    creation_timestamp: number
    pay_url: string
    expiration_timestamp: number
}

export interface BillObject {
    bill_id?: string
    amount: AmountObject
    expiration_timestamp?: number
    custom_fields: CustomFieldsObject
}

export interface AmountObject {
    value: string
    currency: 'RUB' | 'KZT' | string
}

export interface CustomFieldsObject {
    type: 'GUILD'
    reference_id: string
    user_id: string
    pay_sources_filter?: string
    theme_code?: string
}