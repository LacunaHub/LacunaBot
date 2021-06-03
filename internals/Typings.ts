import { Document } from 'mongoose'

export interface ServerDocument extends Document {
    _id: String
    locale: 'en' | 'ru'
    prefix: String
    server: {
        premium: {
            available: Boolean
            will_expire_on: Number
        }
        blocked: Boolean
    }
    commands: {
        system: Array<SystemCommandOptions>
        custom: Array<CustomCommandOptions>
        permissions: {
            allowed: {
                channels: Array<String>
                roles: Array<String>
            }
            blocked: {
                channels: Array<String>
                roles: Array<String>
            }
        }
    }
    moderation: {
        case_log: {
            cases: Array<ModerationCase>
            channel_id: String
            case_types: {
                BAN_ADD: Boolean
                BAN_REMOVE: Boolean
                KICK: Boolean
                MUTE_ADD: Boolean
                MUTE_REMOVE: Boolean
                PRUNE_MESSAGES: Boolean
                WARN_ADD: Boolean
                WARN_REMOVE: Boolean
            }
        }
        logs: {
            webhooks: Array<LogsWebhook>
            types: {
                channel_create: {
                    active: Boolean
                    channel_id: String
                }
                channel_delete: {
                    active: Boolean
                    channel_id: String
                }
                channel_update: {
                    active: Boolean
                    channel_id: String
                }
                guild_ban_add: {
                    active: Boolean
                    channel_id: String
                }
                guild_ban_remove: {
                    active: Boolean
                    channel_id: String
                }
                guild_member_add: {
                    active: Boolean
                    channel_id: String
                }
                guild_member_remove: {
                    active: Boolean
                    channel_id: String
                }
                guild_member_update: {
                    active: Boolean
                    channel_id: String
                }
                guild_update: {
                    active: Boolean
                    channel_id: String
                }
                invite_create: {
                    active: Boolean
                    channel_id: String
                }
                invite_delete: {
                    active: Boolean
                    channel_id: String
                }
                message_delete: {
                    active: Boolean
                    channel_id: String
                }
                message_delete_bulk: {
                    active: Boolean
                    channel_id: String
                }
                message_update: {
                    active: Boolean
                    channel_id: String
                }
                role_create: {
                    active: Boolean,
                    channel_id: String
                }
                role_delete: {
                    active: Boolean
                    channel_id: String
                }
                role_member_add: {
                    active: Boolean
                    channel_id: String
                }
                role_member_remove: {
                    active: Boolean
                    channel_id: String
                }
                role_update: {
                    active: Boolean
                    channel_id: String
                }
                user_update: {
                    active: Boolean
                    channel_id: String
                }
                voice_connect: {
                    active: Boolean
                    channel_id: String
                }
                voice_disconnect: {
                    active: Boolean
                    channel_id: String
                }
                voice_move: {
                    active: Boolean
                    channel_id: String
                }
                voice_server_mute: {
                    active: Boolean
                    channel_id: String
                }
                voice_server_unmute: {
                    active: Boolean
                    channel_id: String
                }
                voice_server_deaf: {
                    active: Boolean
                    channel_id: String
                }
                voice_server_undeaf: {
                    active: Boolean
                    channel_id: String
                }
            }
        }
        automoder: {
            swear_filter: {
                active: Boolean
                registry: Array<String>
                penalty: {
                    action: Number
                    timer: Number
                    message: {
                        content: string
                        embed: MessageEmbed
                    }
                },
                ignored: {
                    channels: Array<String>
                    roles: Array<String>
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
                },
                ignored: {
                    channels: string[]
                    roles: string[]
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
                },
                ignored: {
                    channels: string[]
                    roles: string[]
                }
            }
            anti_caps: {
                active: boolean
                percentage_of_caps: number
                penalty: {
                    action: number
                    timer: number
                    message: {
                        content: string
                        embed: MessageEmbed
                    }
                },
                ignored: {
                    channels: string[]
                    roles: string[]
                }
            }
        }
        warnings: {
            penalties: Array<WarningsPenalty>
            violators: Array<WarningsViolator>
        },
        roles: {
            mute: String
            temporary: Array<TemporaryRoleEntry>
        },
        tempbans: Array<TemporaryBanEntry>
        tempmutes: Array<TemporaryMuteEntry>
    }
    modules: {
        welcome: {
            active: Boolean
            format: 'DM' | 'CHANNEL'
            channel_id: String
            message: {
                content: String
                embed: MessageEmbed
            }
            initial_roles: {
                active: Boolean
                roles: Array<String>
            }
        },
        farewell: {
            active: Boolean
            format: 'DM' | 'CHANNEL'
            channel_id: String
            message: {
                content: String
                embed: MessageEmbed
            }
        },
        reactions: Array<ReactionElement>
        levels: {
            active: Boolean
            single_roles: Boolean
            reset_on_leave: boolean
            blocked: {
                channels: Array<String>
                roles: Array<String>
            },
            allowed: {
                channels: Array<String>
                roles: Array<String>
            },
            level_up_alerts: {
                active: Boolean
                format: Number
                channel_id: String
                message: {
                    content: String
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
            restore_roles: Boolean
            restore_nicknames: Boolean
            strict_roles: Array<String>
            data: Array<RestoringData>
        }
        music: {
            allowed: {
                channels: Array<String>
                roles: Array<String>
            }
            blocked: {
                channels: Array<String>
                roles: Array<String>
            }
            queue_max_length: Number
            track_max_duration: Number
            default_volume: Number
            allow_radio_playback: Boolean
            disable_skip_vote: Boolean
        }
        reports: {
            active: Boolean
            channel_id: String
            emoji: {
                animated: Boolean
                id: String
                name: String
            }
            minimum: Number
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
    created_at: Number
    modified_at: Number
    activity_ping_at: Number
}

export interface SystemCommandOptions {
    name: String
    inactive: Boolean
    throttle: {
        type: 'PER_GUILD' | 'PER_CHANNEL' | 'PER_USER'
        usages: Number
        duration: Number
    }
    delete_command: {
        active: Boolean
        after_ms: Number
    }
    delete_reply: {
        active: Boolean
        after_ms: Number
    }
    allowed: {
        channels: Array<String>
        roles: Array<String>
    }
    blocked: {
        channels: Array<String>
        roles: Array<String>
    }
}

export interface CustomCommandOptions {
    name: String
    active: Boolean
    throttle: {
        type: 'PER_GUILD' | 'PER_CHANNEL' | 'PER_USER'
        usages: Number
        duration: Number
    }
    delete_command: {
        active: Boolean
        after_ms: Number
    }
    delete_reply: {
        active: Boolean
        after_ms: Number
    }
    allowed: {
        channels: Array<String>
        roles: Array<String>
    }
    blocked: {
        channels: Array<String>
        roles: Array<String>
    }
    reply: {
        message: {
            content: String
            tts: Boolean
            embed: import('discord.js').MessageEmbed
        }
    }
    actions: {
        roles: {
            add: Array<String>
            remove: Array<String>
        }
    }
}

export interface ModerationCase {
    case_id: Number
    type: Number
    timestamp: Number
    reason: String
    target: {
        id: String
        name: String
    }
    executor: {
        id: String
        name: String
    }
}

export interface LogsWebhook {
    id: String
    token: String
    channel_id: String
}

export interface WarningsPenalty {
    penalties: Number
    action_type: Number
    time_of_temp_penalty: Number
}

export interface WarningsViolator {
    user_id: String
    violations: Array<ViolatorViolation>
}

export interface ViolatorViolation {
    id: String
    timestamp: Number
    reason: String
}

export interface TemporaryBanEntry {
    user_id: String
    expires_timestamp: Number
}

export interface TemporaryBanConstructor {
    user_id: String
    guild_id: String
    expires_timestamp: Number
    reason: String
    init?: Boolean
}

export interface TemporaryMuteEntry {
    user_id: String
    role_id: String
    expires_timestamp: Number
}

export interface TemporaryMuteConstructor {
    user_id: String
    guild_id: String
    role_id: String
    expires_timestamp: Number
    reason: String
    init?: Boolean
}

export interface TemporaryRoleEntry {
    user_id: String
    role_id: String
    unique_id: String
    expires_timestamp: Number
}

export interface TemporaryRoleConstructor {
    user_id: String
    guild_id: String
    role_id: String
    unique_id: String
    expires_timestamp: Number
    init?: Boolean
}

export interface ReactionElement {
    id: String
    type: 'CHANNEL' | 'ROLE'
    element: {
        single: Boolean
        global_single: Boolean
        reverse: Boolean
        lifespan: Number
    }
    message: {
        id: String
        channel_id: String
    }
    emoji: {
        id: String
        name: String
        animated: Boolean
    }
    references: Array<String>
}

export interface LevelAward {
    id: String
    type: 'CHANNEL' | 'ROLE'
    level: Number
    references: Array<String>
}

export interface VoiceRole {
    role_id: String
    bound_channels_id: Array<String>
}

export interface VoiceChannelTrigger {
    id: String
    channel_id: String
    default: {
        name: String
        limit: Number
        permissions: Number
    }
    children: Array<VoiceChannelTriggerChildren>
}

interface VoiceChannelTriggerChildren {
    channel_id: String
    owner_id: String
    created_at: Number
}

export interface RestoringData {
    user_id: String
    roles: Array<String>
    nickname: String | null
    timestamp: Number
}

export interface UserDocument extends Document {
    _id: String
    flags: Number
    user: {
        username: string
        discriminator: string
        avatar: string
        flags: number
    },
    profile: {
        name: String
        gender: Number
        birth_date: Number
        bio: String
        views: Number
        upvoters: Array<String>
    }
    boost: {
        available: Boolean
        type: Array<BoostType>
        tier: Number
        guilds: Array<BoostedGuild>
    }
    created_at: Number
    modified_at: Number
}

export type BoostType = 'DEVELOPER' | 'TEAM' | 'PATREON' | 'BOOSTY' | 'SERVER_BOOST' | 'CUSTOM'

export interface BoostedGuild {
    id: String
    timestamp: Number
}

export interface CommandInfo {
    fn: Function
    name: String
    group: String | null
    description: String | null
    aliases: Array<String> | null
    subcommands: [] | null
    uses: Number
    guild_only: Boolean
    developer_only: Boolean
    premium_only: Boolean
    private: Boolean
    nsfw: Boolean
    throttling: CommandThrottlingOptions | null
    throttles: Map<String, CommandThrottledUser>
    early_access: Number | null
    self_permissions: import('discord.js').PermissionResolvable[]
    user_permissions: import('discord.js').PermissionResolvable[]
}

export interface SubcommandInfo {
    fn: Function
    name: String
    parent: import('./structures/Command')
    description: String | null
    aliases: Array<String> | null
    premium_only: Boolean
    private: Boolean
    nsfw: Boolean
    self_permissions: import('discord.js').PermissionResolvable
    user_permissions: import('discord.js').PermissionResolvable
}

interface CommandThrottlingOptions {
    usages: Number
    duration: Number
}

interface CommandThrottledUser {
    usages: Number
    throttled: Boolean
    timeout: any
    expires: Number
}

export interface CommandExecutionData {
    command: {
        name: String
        uses: Number
    },
    message: import('discord.js').Message
    args: Array<String>
}

export interface ModuleExecutionData {
    module: String
    guild: {
        id: String
        name: String
    }
    target: {
        id: String
        name: String
    }
}

export interface PlayerQueue {
    tracks: Array<import('@lavacord/discord.js').TrackData>
    repeat: Boolean
    volume: Number
    skip_votes: Number
    executor: String
}

export interface Patron extends Document {
    _id: String
    name: String
    user_id: String
    email: String
    discord_id: String
    last_charge_date: String
    will_pay_amount_cents: Number
    lifetime_support_cents: Number
    patron_status: String
    image_url: String
    last_check_at: Number
}

export interface ServerActivities extends Document {
    _id: String
    levels: Array<LevelActivities>
}

export interface LevelActivities {
    user_id: String
    experience: {
        total: Number
        current: Number
        level: Number
    }
    activity: {
        text: {
            total_messages: Number
            last_message_at: Number
        }
        voice: {
            total_time: Number
            connected_at?: Number
            disconnected_at?: Number
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
    matches: string[]
    exclude_matches: string[]
}