import { MessageButtonStyle } from 'discord.js'
import { Document, model, Schema } from 'mongoose'

export default model<ServerDocument>(
    'servers',
    new Schema<ServerDocument>({
        _id: { type: String },
        locale: { type: String, default: 'ru' },
        prefix: { type: String, default: '!' },
        server: {
            premium: {
                available: { type: Boolean, default: false },
                will_expire_on: { type: Number, default: 0 }
            },
            blocked: { type: Boolean, default: false },
            bot_expert_roles: { type: Array, default: [] }
        },
        commands: {
            system: { type: Array, default: [] },
            custom: { type: Array, default: [] },
            slash_commands: { type: Boolean, default: false },
            prefix_commands: { type: Boolean, default: true }
        },
        moderation: {
            case_log: {
                cases: { type: Array, default: [] },
                channel_id: { type: String, default: '' },
                case_types: {
                    BAN_ADD: { type: Boolean, default: true },
                    BAN_REMOVE: { type: Boolean, default: true },
                    KICK: { type: Boolean, default: true },
                    MUTE_ADD: { type: Boolean, default: true },
                    MUTE_REMOVE: { type: Boolean, default: true },
                    PRUNE_MESSAGES: { type: Boolean, default: true },
                    WARN_ADD: { type: Boolean, default: true },
                    WARN_REMOVE: { type: Boolean, default: true }
                },
                case_types_messages: {
                    BAN_ADD: {
                        active: { type: Boolean, default: true },
                        dm_message: {
                            content: { type: String, default: '' },
                            embed: {
                                active: { type: Boolean, default: true },
                                title: { type: String, default: null },
                                description: { type: String, default: null },
                                url: { type: String, default: null },
                                timestamp: { type: String, default: 'DATENOW()' },
                                color: { type: String, default: '#EF5350' },
                                footer: {
                                    text: { type: String, default: null },
                                    icon_url: { type: String, default: null }
                                },
                                image: {
                                    url: { type: String, default: null }
                                },
                                thumbnail: {
                                    url: { type: String, default: null }
                                },
                                author: {
                                    name: { type: String, default: 'Блокировка выдана' },
                                    url: { type: String, default: null },
                                    icon_url: { type: String, default: 'https://i.imgur.com/qI02Ivf.png' }
                                },
                                fields: { type: Array, default: [ { name: 'Сервер', value: '{ guild.name }', inline: true }, { name: 'Причина', value: '{ penalty.reason }', inline: true } ] }
                            }
                        }
                    },
                    KICK: {
                        active: { type: Boolean, default: true },
                        dm_message: {
                            content: { type: String, default: '' },
                            embed: {
                                active: { type: Boolean, default: true },
                                title: { type: String, default: null },
                                description: { type: String, default: null },
                                url: { type: String, default: null },
                                timestamp: { type: String, default: 'DATENOW()' },
                                color: { type: String, default: '#EF5350' },
                                footer: {
                                    text: { type: String, default: null },
                                    icon_url: { type: String, default: null }
                                },
                                image: {
                                    url: { type: String, default: null }
                                },
                                thumbnail: {
                                    url: { type: String, default: null }
                                },
                                author: {
                                    name: { type: String, default: 'Участник выгнан' },
                                    url: { type: String, default: null },
                                    icon_url: { type: String, default: 'https://i.imgur.com/RYVLGuy.png' }
                                },
                                fields: { type: Array, default: [ { name: 'Сервер', value: '{ guild.name }', inline: true }, { name: 'Причина', value: '{ penalty.reason }', inline: true } ] }
                            }
                        }
                    },
                    MUTE_ADD: {
                        active: { type: Boolean, default: true },
                        dm_message: {
                            content: { type: String, default: '' },
                            embed: {
                                active: { type: Boolean, default: true },
                                title: { type: String, default: null },
                                description: { type: String, default: null },
                                url: { type: String, default: null },
                                timestamp: { type: String, default: 'DATENOW()' },
                                color: { type: String, default: '#EF5350' },
                                footer: {
                                    text: { type: String, default: null },
                                    icon_url: { type: String, default: null }
                                },
                                image: {
                                    url: { type: String, default: null }
                                },
                                thumbnail: {
                                    url: { type: String, default: null }
                                },
                                author: {
                                    name: { type: String, default: 'Заглушение выдано' },
                                    url: { type: String, default: null },
                                    icon_url: { type: String, default: 'https://i.imgur.com/t5FJ6Gw.png' }
                                },
                                fields: { type: Array, default: [ { name: 'Сервер', value: '{ guild.name }', inline: true }, { name: 'Причина', value: '{ penalty.reason }', inline: true } ] }
                            }
                        }
                    },
                    WARN_ADD: {
                        active: { type: Boolean, default: true },
                        dm_message: {
                            content: { type: String, default: '' },
                            embed: {
                                active: { type: Boolean, default: true },
                                title: { type: String, default: null },
                                description: { type: String, default: null },
                                url: { type: String, default: null },
                                timestamp: { type: String, default: 'DATENOW()' },
                                color: { type: String, default: '#EF5350' },
                                footer: {
                                    text: { type: String, default: null },
                                    icon_url: { type: String, default: null }
                                },
                                image: {
                                    url: { type: String, default: null }
                                },
                                thumbnail: {
                                    url: { type: String, default: null }
                                },
                                author: {
                                    name: { type: String, default: 'Предупреждение выдано' },
                                    url: { type: String, default: null },
                                    icon_url: { type: String, default: 'https://i.imgur.com/R03G3G5.png' }
                                },
                                fields: { type: Array, default: [ { name: 'Сервер', value: '{ guild.name }', inline: true }, { name: 'Причина', value: '{ penalty.reason }', inline: true } ] }
                            }
                        }
                    }
                }
            },
            logs: {
                webhooks: { type: Array, default: [] },
                types: {
                    channel_create: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    channel_delete: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    channel_update: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    emoji_create: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    emoji_delete: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    emoji_update: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    guild_ban_add: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    guild_ban_remove: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    guild_member_add: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    guild_member_remove: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    guild_member_update: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    guild_update: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    invite_create: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    invite_delete: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    message_delete: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    message_delete_bulk: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    message_update: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    role_create: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    role_delete: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    role_member_add: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    role_member_remove: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    role_update: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    sticker_create: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    sticker_delete: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    sticker_update: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    thread_create: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    thread_delete: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    thread_update: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    user_update: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    voice_connect: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    voice_disconnect: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    voice_move: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    voice_server_mute: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    voice_server_unmute: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    voice_server_deaf: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    },
                    voice_server_undeaf: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: '' }
                    }
                }
            },
            automoder: {
                swear_filter: {
                    active: { type: Boolean, default: false },
                    registry: { type: Array, default: [] },
                    penalty: {
                        action: { type: Number, default: 0 },
                        timer: { type: Number, default: 0 },
                        message: {
                            content: { type: String, default: '' },
                            embed: {
                                active: { type: Boolean, default: false },
                                title: { type: String, default: null },
                                description: { type: String, default: null },
                                url: { type: String, default: null },
                                timestamp: { type: String, default: null },
                                color: { type: String, default: null },
                                footer: {
                                    text: { type: String, default: null },
                                    icon_url: { type: String, default: null }
                                },
                                image: {
                                    url: { type: String, default: null }
                                },
                                thumbnail: {
                                    url: { type: String, default: null }
                                },
                                author: {
                                    name: { type: String, default: null },
                                    url: { type: String, default: null },
                                    icon_url: { type: String, default: null }
                                },
                                fields: { type: Array, default: [] }
                            }
                        },
                        add_roles: { type: Array, default: [] },
                        remove_roles: { type: Array, default: [] }
                    },
                    ignored: {
                        channels: { type: Array, default: [] },
                        roles: { type: Array, default: [] },
                        permissions: { type: Number, default: 8 }
                    }
                },
                links_filter: {
                    active: { type: Boolean, default: false },
                    registry: { type: Array, default: [] },
                    allowed_registry: { type: Array, default: [] },
                    delete_all_links: { type: Boolean, default: false },
                    delete_referral_invites: { type: Boolean, default: false },
                    penalty: {
                        action: { type: Number, default: 0 },
                        timer: { type: Number, default: 0 },
                        message: {
                            content: { type: String, default: '' },
                            embed: {
                                active: { type: Boolean, default: false },
                                title: { type: String, default: null },
                                description: { type: String, default: null },
                                url: { type: String, default: null },
                                timestamp: { type: String, default: null },
                                color: { type: String, default: null },
                                footer: {
                                    text: { type: String, default: null },
                                    icon_url: { type: String, default: null }
                                },
                                image: {
                                    url: { type: String, default: null }
                                },
                                thumbnail: {
                                    url: { type: String, default: null }
                                },
                                author: {
                                    name: { type: String, default: null },
                                    url: { type: String, default: null },
                                    icon_url: { type: String, default: null }
                                },
                                fields: { type: Array, default: [] }
                            }
                        },
                        add_roles: { type: Array, default: [] },
                        remove_roles: { type: Array, default: [] }
                    },
                    ignored: {
                        channels: { type: Array, default: [] },
                        roles: { type: Array, default: [] },
                        permissions: { type: Number, default: 8 }
                    }
                },
                users_slowdown: {
                    active: { type: Boolean, default: false },
                    messages_limit: { type: Array, default: 3 },
                    penalty: {
                        action: { type: Number, default: 0 },
                        timer: { type: Number, default: 0 },
                        message: {
                            content: { type: String, default: '' },
                            embed: {
                                active: { type: Boolean, default: false },
                                title: { type: String, default: null },
                                description: { type: String, default: null },
                                url: { type: String, default: null },
                                timestamp: { type: String, default: null },
                                color: { type: String, default: null },
                                footer: {
                                    text: { type: String, default: null },
                                    icon_url: { type: String, default: null }
                                },
                                image: {
                                    url: { type: String, default: null }
                                },
                                thumbnail: {
                                    url: { type: String, default: null }
                                },
                                author: {
                                    name: { type: String, default: null },
                                    url: { type: String, default: null },
                                    icon_url: { type: String, default: null }
                                },
                                fields: { type: Array, default: [] }
                            }
                        },
                        add_roles: { type: Array, default: [] },
                        remove_roles: { type: Array, default: [] }
                    },
                    ignored: {
                        channels: { type: Array, default: [] },
                        roles: { type: Array, default: [] },
                        permissions: { type: Number, default: 8 }
                    }
                },
                anti_caps: {
                    active: { type: Boolean, default: false },
                    percentage_of_caps: { type: Number, default: 70 },
                    minimum_content_length: { type: Number, default: 10 },
                    penalty: {
                        action: { type: Number, default: 0 },
                        timer: { type: Number, default: 0 },
                        message: {
                            content: { type: String, default: '' },
                            embed: {
                                active: { type: Boolean, default: false },
                                title: { type: String, default: null },
                                description: { type: String, default: null },
                                url: { type: String, default: null },
                                timestamp: { type: String, default: null },
                                color: { type: String, default: null },
                                footer: {
                                    text: { type: String, default: null },
                                    icon_url: { type: String, default: null }
                                },
                                image: {
                                    url: { type: String, default: null }
                                },
                                thumbnail: {
                                    url: { type: String, default: null }
                                },
                                author: {
                                    name: { type: String, default: null },
                                    url: { type: String, default: null },
                                    icon_url: { type: String, default: null }
                                },
                                fields: { type: Array, default: [] }
                            }
                        },
                        add_roles: { type: Array, default: [] },
                        remove_roles: { type: Array, default: [] }
                    },
                    ignored: {
                        channels: { type: Array, default: [] },
                        roles: { type: Array, default: [] },
                        permissions: { type: Number, default: 8 }
                    }
                },
                nicknames: {
                    active: { type: Boolean, default: false },
                    types: {
                        special_characters: { type: Boolean, default: false },
                        zalgo: { type: Boolean, default: false },
                        diacritics: { type: Boolean, default: false },
                        emojis: { type: Boolean, default: false },
                        regexp: {
                            pattern: { type: String, default: '' },
                            flags: { type: Array, default: [] }
                        },
                        contains: { type: Array, default: [] }
                    },
                    ignored: {
                        roles: { type: Array, default: [] },
                        permissions: { type: Number, default: 8 },
                        bots: { type: Boolean, default: false }
                    }
                },
                newbies: {
                    active: { type: Boolean, default: false },
                    minimum_account_age: {
                        value: { type: Number, default: 12 },
                        measure: { type: String, default: 'HOURS' }
                    },
                    penalty: {
                        action: { type: Number, default: 0 },
                        timer: { type: Number, default: 0 },
                        add_roles: { type: Array, default: [] },
                        remove_roles: { type: Array, default: [] }
                    }
                }
            },
            warnings: {
                penalties: { type: Array, default: [] },
                violators: { type: Array, default: [] }
            },
            roles: {
                mute: { type: String, default: '' },
                temporary: { type: Array, default: [] },
                on_mute: {
                    remove_all_roles: { type: Boolean, default: false },
                    strict_roles: { type: Array, default: [] },
                    returnable_roles: { type: Array, default: [] }
                }
            },
            tempbans: { type: Array, default: [] },
            tempmutes: { type: Array, default: [] },
            use_timeout_mute: { type: Boolean, default: false }
        },
        modules: {
            welcome: {
                active: { type: Boolean, default: false },
                format: { type: String, default: 'DM' },
                channel_id: { type: String, default: '' },
                message: {
                    content: { type: String, default: '' },
                    embed: {
                        active: { type: Boolean, default: false },
                        title: { type: String, default: null },
                        description: { type: String, default: null },
                        url: { type: String, default: null },
                        timestamp: { type: String, default: null },
                        color: { type: String, default: null },
                        footer: {
                            text: { type: String, default: null },
                            icon_url: { type: String, default: null }
                        },
                        image: {
                            url: { type: String, default: null }
                        },
                        thumbnail: {
                            url: { type: String, default: null }
                        },
                        author: {
                            name: { type: String, default: null },
                            url: { type: String, default: null },
                            icon_url: { type: String, default: null }
                        },
                        fields: { type: Array, default: [] }
                    }
                },
                initial_roles: {
                    active: { type: Boolean, default: false },
                    roles: { type: Array, default: [] }
                }
            },
            farewell: {
                active: { type: Boolean, default: false },
                format: { type: String, default: 'DM' },
                channel_id: { type: String, default: '' },
                message: {
                    content: { type: String, default: '' },
                    embed: {
                        active: { type: Boolean, default: false },
                        title: { type: String, default: null },
                        description: { type: String, default: null },
                        url: { type: String, default: null },
                        timestamp: { type: String, default: null },
                        color: { type: String, default: null },
                        footer: {
                            text: { type: String, default: null },
                            icon_url: { type: String, default: null }
                        },
                        image: {
                            url: { type: String, default: null }
                        },
                        thumbnail: {
                            url: { type: String, default: null }
                        },
                        author: {
                            name: { type: String, default: null },
                            url: { type: String, default: null },
                            icon_url: { type: String, default: null }
                        },
                        fields: { type: Array, default: [] }
                    }
                }
            },
            reactions: { type: Array, default: [] },
            levels: {
                active: { type: Boolean, default: false },
                voice: { type: Boolean, default: false },
                single_roles: { type: Boolean },
                reset_on_leave: { type: Boolean, default: false },
                blocked: {
                    channels: { type: Array, default: [] },
                    roles: { type: Array, default: [] }
                },
                allowed: {
                    channels: { type: Array, default: [] },
                    roles: { type: Array, default: [] }
                },
                level_up_alerts: {
                    active: { type: Boolean, default: false },
                    format: { type: String, default: 'CURRENT_CHANNEL' },
                    channel_id: { type: String, default: '' },
                    message: {
                        content: { type: String, default: '' },
                        embed: {
                            active: { type: Boolean, default: false },
                            title: { type: String, default: null },
                            description: { type: String, default: null },
                            url: { type: String, default: null },
                            timestamp: { type: String, default: null },
                            color: { type: String, default: null },
                            footer: {
                                text: { type: String, default: null },
                                icon_url: { type: String, default: null }
                            },
                            image: {
                                url: { type: String, default: null }
                            },
                            thumbnail: {
                                url: { type: String, default: null }
                            },
                            author: {
                                name: { type: String, default: null },
                                url: { type: String, default: null },
                                icon_url: { type: String, default: null }
                            },
                            fields: { type: Array, default: [] }
                        }
                    }
                },
                awards: { type: Array, default: [] }
            },
            voice_manager: {
                voice_roles: { type: Array, default: [] },
                autovoices: { type: Array, default: [] }
            },
            restoring: {
                restore_roles: { type: Boolean, default: false },
                restore_nicknames: { type: Boolean, default: false },
                strict_roles: { type: Array, default: [] },
                data: { type: Array, default: [] }
            },
            music: {
                allowed: {
                    channels: { type: Array, default: [] },
                    roles: { type: Array, default: [] }
                },
                blocked: {
                    channels: { type: Array, default: [] },
                    roles: { type: Array, default: [] }
                },
                queue_max_length: { type: Number, default: 15 },
                track_max_duration: { type: Number, default: 0 },
                default_volume: { type: Number, default: 100 },
                allow_radio_playback: { type: Boolean, default: false },
                disable_skip_vote: { type: Boolean, default: false }
            },
            statistics: { type: Array, default: [] },
            reports: {
                active: { type: Boolean, default: false },
                channel_id: { type: String, default: '' }
            },
            autoreactions: { type: Array, default: [] },
            economy: {
                active: { type: Boolean, default: false },
                reset_wallet_on_leave: { type: Boolean, default: false },
                currencies: {
                    type: Array,
                    default: [
                        {
                            id: 'DEFAULT',
                            name: 'Cash',
                            symbol: '$',
                            options: [],
                            income: {
                                messages: {
                                    range_per_message: [1, 5],
                                    rate_limit_per_user: 60
                                },
                                voice_channels: {
                                    range_per_minute: [0.2, 1]
                                },
                                allowed: {
                                    channels: [],
                                    roles: []
                                },
                                blocked: {
                                    channels: [],
                                    roles: []
                                }
                            }
                        }
                    ]
                },
                store: {
                    items: { type: Array, default: [] }
                }
            },
            subscriptions: {
                twitch: { type: Array, default: [] },
                youtube: { type: Array, default: [] }
            },
            interactive_messages: { type: Array, default: [] }
        },
        utility: {
            giveaways: { type: Array, default: [] }
        },
        created_at: { type: Number, default: () => Date.now() },
        activity_ping_at: { type: Number, default: () => Date.now() },
        change_log: { type: Array, default: [] }
    }, { versionKey: false })
)

export interface ServerDocument extends Document {
    _id: string
    locale: 'en' | 'ru'
    prefix: string
    server: {
        premium: {
            available: boolean
            will_expire_on: number
        }
        blocked: boolean
        bot_expert_roles: string[]
    }
    commands: {
        system: SystemCommand[]
        custom: CustomCommand[]
        /** @deprecated */
        permissions: {
            allowed: {
                channels: string[]
                roles: string[]
            }
            blocked: {
                channels: string[]
                roles: string[]
            }
        }
        slash_commands: boolean
        prefix_commands: boolean
    }
    moderation: {
        case_log: {
            cases: ModerationCase[]
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
            case_types_messages: {
                BAN_ADD: {
                    active: boolean
                    dm_message: {
                        content: string
                        embed: MessageEmbed
                    }
                }
                KICK: {
                    active: boolean
                    dm_message: {
                        content: string
                        embed: MessageEmbed
                    }
                }
                MUTE_ADD: {
                    active: boolean
                    dm_message: {
                        content: string
                        embed: MessageEmbed
                    }
                }
                WARN_ADD: {
                    active: boolean
                    dm_message: {
                        content: string
                        embed: MessageEmbed
                    }
                }
                [key: string]: {
                    active: boolean
                    dm_message: {
                        content: string
                        embed: MessageEmbed
                    }
                }
            }
        }
        logs: {
            webhooks: LogsWebhook[]
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
                emoji_create: {
                    active: boolean
                    channel_id: string
                }
                emoji_delete: {
                    active: boolean
                    channel_id: string
                }
                emoji_update: {
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
                sticker_create: {
                    active: boolean
                    channel_id: string
                }
                sticker_delete: {
                    active: boolean
                    channel_id: string
                }
                sticker_update: {
                    active: boolean
                    channel_id: string
                }
                thread_create: {
                    active: boolean
                    channel_id: string
                }
                thread_delete: {
                    active: boolean
                    channel_id: string
                }
                thread_update: {
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
                registry: string[]
                penalty: {
                    action: number
                    timer: number
                    message: {
                        content: string
                        embed: MessageEmbed
                    }
                    add_roles: string[]
                    remove_roles: string[]
                }
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
                }
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
                }
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
                }
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
                    bots: boolean
                }
            }
            newbies: {
                active: boolean
                minimum_account_age: {
                    value: number
                    measure: 'MINUTES' | 'HOURS' | 'DAYS'
                }
                penalty: {
                    action: number
                    timer: number
                    add_roles: string[]
                    remove_roles: string[]
                }
            }
        }
        warnings: {
            penalties: WarningsPenalty[]
            violators: WarningsViolator[]
        },
        roles: {
            mute: string
            temporary: TemporaryRoleEntry[]
            on_mute: {
                remove_all_roles: boolean
                strict_roles: string[]
                returnable_roles: Array<{ user_id: string, roles: string[] }>
            }
        },
        tempbans: TemporaryBanEntry[]
        tempmutes: TemporaryMuteEntry[]
        use_timeout_mute: boolean
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
                roles: string[]
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
        reactions: ReactionElement[]
        levels: {
            active: boolean
            voice: boolean
            single_roles?: boolean
            reset_on_leave: boolean
            blocked: {
                channels: string[]
                roles: string[]
            },
            allowed: {
                channels: string[]
                roles: string[]
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
            awards: LevelAward[]
        },
        voice_manager: {
            voice_roles: VoiceRole[]
            /** @deprecated */
            temp_voice_channels: {
                triggers: any[]
            }
            autovoices: IAutoVoice[]
        },
        restoring: {
            restore_roles: boolean
            restore_nicknames: boolean
            strict_roles: string[]
            data: RestoringData[]
        }
        music: {
            allowed: {
                channels: string[]
                roles: string[]
            }
            blocked: {
                channels: string[]
                roles: string[]
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
        /** @deprecated */
        twitch: {
            custom_client_id: string
            channels: TwitchChannel[]
        }
        /** @deprecated */
        youtube: {
            custom_api_key: string
            channels: YouTubeChannel[]
        }
        autoreactions: AutoReaction[]
        economy: {
            active: boolean
            reset_wallet_on_leave: boolean
            currencies: EconomyCurrency[]
            store: {
                items: EconomyStoreItem[]
            }
        }
        subscriptions: {
            twitch: ITwitchSubscription[],
            youtube: IYouTubeSubscription[]
        }
        interactive_messages: InteractiveMessage[]
    }
    utility: {
        giveaways: Giveaway[]
    }
    created_at: number
    /** @deprecated */
    modified_at: number
    activity_ping_at: number
    change_log: ChangeLog[]
}

export interface SystemCommand {
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
        channels: string[]
        roles: string[]
    }
    blocked: {
        channels: string[]
        roles: string[]
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
        channels: string[]
        roles: string[]
    }
    blocked: {
        channels: string[]
        roles: string[]
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
    violations: ViolatorViolation[]
}

export interface ViolatorViolation {
    id: string
    timestamp: number
    reason: string
}

export interface TemporaryRoleEntry {
    user_id: string
    role_id: string
    unique_id: string
    expires_timestamp: number
}

export interface TemporaryBanEntry {
    user_id: string
    expires_timestamp: number
}

export interface TemporaryMuteEntry {
    user_id: string
    role_id: string
    expires_timestamp: number
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
    references: string[]
}

export interface InteractiveMessage {
    id: string
    channel_id: string
    message: {
        content: string
        embed: MessageEmbed
    }
    components: (InteractiveMessageButtonComponent | InteractiveMessageSelectMenuComponent)[][]
    reactions: InteractiveMessageReaction[]
}

export interface InteractiveMessageButtonComponent {
    id: string
    type: 'BUTTON'
    options: InteractiveMessageComponentOption[]
    appearance: {
        label: string
        style: MessageButtonStyle
        emoji: {
            id: string
            name: string
            animated: boolean
        }
        url: string
        disabled: boolean
    }
    ephemeral_reply?: {
        content: string
        embed: MessageEmbed
    }
    modify_roles?: {
        add: string[]
        remove: string[]
        reversible_add: boolean
        reversible_remove: boolean
        duration: number
    }
    overwrite_channel_permissions?: {
        channels: string[]
        permissions: {
            [key: string]: boolean
        }
        reversible: boolean
    }
}

export interface InteractiveMessageSelectMenuComponent {
    id: string
    type: 'SELECT_MENU'
    placeholder: string
    _options: InteractiveMessageSelectMenuComponentOption[]
    disabled: boolean
}

export interface InteractiveMessageSelectMenuComponentOption {
    options: InteractiveMessageComponentOption[]
    appearance: {
        label: string
        value: string
        description: string
        emoji: {
            id: string
            name: string
            animated: boolean
        }
    }
    ephemeral_reply?: {
        content: string
        embed: MessageEmbed
    }
    modify_roles?: {
        add: string[]
        remove: string[]
        reversible_add: boolean
        reversible_remove: boolean
        duration: number
    }
    overwrite_channel_permissions?: {
        channels: string[]
        permissions: {
            [key: string]: boolean
        }
        reversible: boolean
    }
}

export type InteractiveMessageComponentOption = 'EPHEMERAL_REPLY' | 'MODIFY_ROLES' | 'OVERWRITE_CHANNEL_PERMISSIONS'

export interface InteractiveMessageReaction {
    id: string
    options: InteractiveMessageReactionOption[]
    emoji: {
        id: string
        name: string
        animated: boolean
    }
    modify_roles?: {
        add: string[]
        remove: string[]
        reversible_add: boolean
        reversible_remove: boolean
        duration: number
    }
    overwrite_channel_permissions?: {
        channels: string[]
        permissions: {
            [key: string]: boolean
        }
        reversible: boolean
    }
}

export type InteractiveMessageReactionOption = 'MODIFY_ROLES' | 'OVERWRITE_CHANNEL_PERMISSIONS'

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
    bound_channels_id: string[]
}

export interface IAutoVoice {
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
    children: IAutoVoiceChild[]
}

export interface IAutoVoiceChild {
    channel_id: string
    owner_id: string
    created_at: number
}

export interface RestoringData {
    user_id: string
    roles: string[]
    nickname: string | null
    timestamp: number
}

/** @deprecated */
export interface TwitchChannel {
    active: boolean
    live: boolean
    last_check_timestamp: number
    channel: {
        id: number
        display_name: string
        logo: string
    }
    alerts: {
        channel_id: string
        /** @deprecated */
        message_template: string
        message: {
            content: string
        }
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

export interface ITwitchSubscription {
    broadcaster_id: string
    broadcaster_name: string
    broadcaster_thumbnail_url: string
    notification_channel_id: string
    notification_message: { content: string }
    webhook_id: string
    webhook_token: string
    display_stream_preview: boolean
}

export interface IYouTubeSubscription {
    channel_id: string
    channel_name: string
    channel_thumbnail_url: string
    notification_channel_id: string
    notification_message: { content: string }
    webhook_id: string
    webhook_token: string
}

/** @deprecated */
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
        /** @deprecated */
        videos_message_template: string
        /** @deprecated */
        broadcasts_message_template: string
        videos_message: {
            content: string
        }
        broadcasts_message: {
            content: string
        }
        videos: boolean
        broadcasts: boolean
        webhook: {
            id: string
            token: string
        }
    }
}

export interface AutoReaction {
    channel_id: string
    reactions: Array<{ animated: boolean, id: string, name: string }>
    message_types: string[]
    matches: string[]
    exclude_matches: string[]
}

export interface EconomyCurrency {
    id: string
    name: string
    symbol: string
    options: string[]
    income: {
        messages: {
            range_per_message: number[]
            rate_limit_per_user: number
        }
        voice_channels: {
            range_per_minute: number[]
        }
        allowed: {
            channels: string[]
            roles: string[]
        }
        blocked: {
            channels: string[]
            roles: string[]
        }
    }
}

export interface EconomyStoreItem {
    id: string
    name: string
    type: 'CHANNEL' | 'ROLE'
    description: string
    options: EconomyStoreItemOptions[]
    purchase_price: number
    selling_price?: number
    currency_id: string
    quantity?: number
    references: string[]
    references_duration?: {
        value: 1
        measure: 'MINUTES' | 'HOURS' | 'DAYS'
    }
    custom_purchase_reply?: {
        content: string
        embed: MessageEmbed
    }
}

export type EconomyStoreItemOptions = 'SELLABLE' | 'LIMITED_QUANTITY' | 'TEMPORARY_REFERENCES' | 'CUSTOM_PURCHASE_REPLY'

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

export interface ChangeLog {
    user_id: string
    changes: string[]
    timestamp: number
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