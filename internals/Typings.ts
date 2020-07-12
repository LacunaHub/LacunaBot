export interface ServerDocument {
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
        }
        logs: {
            member_add: {
                active: Boolean
                channel_id: String
            }
            member_remove: {
                active: Boolean
                channel_id: String
            }
        }
        automoder: {
            swear_filter: {
                active: Boolean
                registry: Array<String>
                penalty: {
                    action: Number
                    timer: Number
                    warn_message: String
                },
                ignored: {
                    channels: Array<String>
                    roles: Array<String>
                }
            }
        }
        warnings: {
            penalties: Array<WarnPenalty>
            violators: Array<WarnViolator>
        },
        roles: {
            mute: String
        },
        tempbans: Array<TemporaryBanEntry>
        tempmutes: Array<TemporaryMuteEntry>
    }
    modules: {
        welcome: {
            active: Boolean
            format: Number
            channel_id: String
            message: {
                content: String
            }
        },
        farewell: {
            active: Boolean
            format: Number
            channel_id: String
            message: {
                content: String
            }
        },
        reactions: Array<ReactionElement>
        levels: {
            active: Boolean
            single_roles: Boolean
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
                    embed: import('discord.js').MessageEmbed
                }
            },
            awards: Array<LevelAward>
        },
        voice_manager: {
            voice_roles: Array<VoiceRole>
            temporary_voice_channels: {
                triggers: Array<VoiceChannelTrigger>
            }
        },
        restoring: {
            restore_roles: Boolean
            restore_nicknames: Boolean
            strict_roles: Array<String>
            data: Array<RestoringData>
        }
    }
    created_at: Number
}

export interface SystemCommandOptions {
    name: String
    active: Boolean
    throttle: {
        type: 0 | 1 | 2
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
        type: 0 | 1 | 2
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

export interface WarnPenalty {
    amount: Number
    action: Number
    timer?: Number
}

export interface WarnViolator {
    user_id: String
    violations: Number
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

export interface ReactionElement {
    id: String
    type: Number
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
    type: Number
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
        limit: String
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

export interface UserDocument {
    _id: String
    flags: Number
    profile: {
        name: String
        gender: Number
        birth_date: Number
        bio: String
        views: Number
        upvoters: Array<String>
    }
    balance: Number
    created_at: Number
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
    owner_only: Boolean
    premium_only: Boolean
    hidden: Boolean
    nsfw: Boolean
    throttling: CommandThrottlingOptions | null
    throttles: Map<String, CommandThrottledUser>
    early_access: Number | null
    self_permissions: import('discord.js').PermissionResolvable | null
    user_permissions: import('discord.js').PermissionResolvable | null
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