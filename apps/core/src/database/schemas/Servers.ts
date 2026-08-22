import mongoose, { type FilterQuery } from 'mongoose'

const schema = new mongoose.Schema<ServerDocument, ServerModel>(
    {
        _id: { type: String },
        locale: { type: String, default: 'en' },
        blocked: { type: Boolean, default: false },
        bot_experts: { type: [String], default: [] },
        commands: {
            configuration: { type: [], default: [] }
        },
        moderation: {
            case_log: {
                case_count: { type: Number, default: 0 },
                channel_id: { type: String, default: null },
                types: {
                    BAN_ADD: {
                        active: { type: Boolean, default: true },
                        channel_id: { type: String, default: null },
                        custom_dm_message: { type: Boolean, default: false },
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
                                    name: { type: String, default: 'Ban Added' },
                                    url: { type: String, default: null },
                                    icon_url: { type: String, default: 'https://i.imgur.com/qI02Ivf.png' }
                                },
                                fields: {
                                    type: [],
                                    default: [
                                        { name: 'Guild', value: '{ guild.name }', inline: true },
                                        { name: 'Reason', value: '{ penalty.reason }', inline: true }
                                    ]
                                }
                            }
                        }
                    },
                    BAN_REMOVE: {
                        active: { type: Boolean, default: true },
                        channel_id: { type: String, default: null }
                    },
                    KICK: {
                        active: { type: Boolean, default: true },
                        channel_id: { type: String, default: null },
                        custom_dm_message: { type: Boolean, default: false },
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
                                    name: { type: String, default: 'Member Kicked' },
                                    url: { type: String, default: null },
                                    icon_url: { type: String, default: 'https://i.imgur.com/RYVLGuy.png' }
                                },
                                fields: {
                                    type: [],
                                    default: [
                                        { name: 'Guild', value: '{ guild.name }', inline: true },
                                        { name: 'Reason', value: '{ penalty.reason }', inline: true }
                                    ]
                                }
                            }
                        }
                    },
                    MUTE_ADD: {
                        active: { type: Boolean, default: true },
                        channel_id: { type: String, default: null },
                        custom_dm_message: { type: Boolean, default: false },
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
                                    name: { type: String, default: 'Mute Added' },
                                    url: { type: String, default: null },
                                    icon_url: { type: String, default: 'https://i.imgur.com/t5FJ6Gw.png' }
                                },
                                fields: {
                                    type: [],
                                    default: [
                                        { name: 'Guild', value: '{ guild.name }', inline: true },
                                        { name: 'Reason', value: '{ penalty.reason }', inline: true }
                                    ]
                                }
                            }
                        }
                    },
                    MUTE_REMOVE: {
                        active: { type: Boolean, default: true },
                        channel_id: { type: String, default: null }
                    },
                    PRUNE_MESSAGES: {
                        active: { type: Boolean, default: true },
                        channel_id: { type: String, default: null }
                    },
                    WARN_ADD: {
                        active: { type: Boolean, default: true },
                        channel_id: { type: String, default: null },
                        custom_dm_message: { type: Boolean, default: false },
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
                                    name: { type: String, default: 'Warn Added' },
                                    url: { type: String, default: null },
                                    icon_url: { type: String, default: 'https://i.imgur.com/R03G3G5.png' }
                                },
                                fields: {
                                    type: [],
                                    default: [
                                        { name: 'Guild', value: '{ guild.name }', inline: true },
                                        { name: 'Reason', value: '{ penalty.reason }', inline: true }
                                    ]
                                }
                            }
                        }
                    },
                    WARN_REMOVE: {
                        active: { type: Boolean, default: true },
                        channel_id: { type: String, default: null }
                    }
                }
            },
            logs: {
                webhooks: { type: [], default: [] },
                types: {
                    channel_create: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    channel_delete: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    channel_update: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    emoji_create: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    emoji_delete: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    emoji_update: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    guild_ban_add: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    guild_ban_remove: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    guild_member_add: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    guild_member_remove: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    guild_member_update: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    guild_update: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    invite_create: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    invite_delete: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    message_delete: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    message_delete_bulk: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    message_update: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    role_create: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    role_delete: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    role_member_add: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    role_member_remove: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    role_update: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    sticker_create: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    sticker_delete: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    sticker_update: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    thread_create: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    thread_delete: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    thread_update: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    user_update: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    voice_connect: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    voice_disconnect: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    voice_move: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    voice_server_mute: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    voice_server_unmute: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    voice_server_deaf: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    },
                    voice_server_undeaf: {
                        active: { type: Boolean, default: false },
                        channel_id: { type: String, default: null }
                    }
                }
            },
            automoder: {
                anti_caps: {
                    active: { type: Boolean, default: false },
                    percentage_of_caps: { type: Number, default: 70 },
                    minimum_content_length: { type: Number, default: 10 },
                    options: { type: [String], default: ['ACTION_DELETE_MESSAGE'] },
                    ban_timeout: { type: Number },
                    mute_timeout: { type: Number },
                    modify_roles: {
                        add: { type: [String], default: [] },
                        remove: { type: [String], default: [] }
                    },
                    send_message: {
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
                            fields: { type: [], default: [] }
                        }
                    },
                    ignored: {
                        channels: { type: [String], default: [] },
                        roles: { type: [String], default: [] },
                        permissions: { type: [Number], default: [8] }
                    }
                },
                links_filter: {
                    active: { type: Boolean, default: false },
                    allowed_registry: { type: [String], default: [] },
                    blocked_registry: { type: [String], default: [] },
                    options: { type: [String], default: ['ACTION_DELETE_MESSAGE'] },
                    ban_timeout: { type: Number },
                    mute_timeout: { type: Number },
                    modify_roles: {
                        add: { type: [String], default: [] },
                        remove: { type: [String], default: [] }
                    },
                    send_message: {
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
                            fields: { type: [], default: [] }
                        }
                    },
                    ignored: {
                        channels: { type: [String], default: [] },
                        roles: { type: [String], default: [] },
                        permissions: { type: [Number], default: [8] }
                    }
                },
                nicknames: {
                    active: { type: Boolean, default: false },
                    options: { type: [String], default: [] },
                    contains: { type: [String], default: [] },
                    ignored: {
                        roles: { type: [String], default: [] },
                        permissions: { type: [Number], default: [8] },
                        bots: { type: Boolean, default: false }
                    }
                },
                newbies: {
                    active: { type: Boolean, default: false },
                    minimum_account_age: {
                        value: { type: Number, default: 12 },
                        measure: { type: String, default: 'HOURS' }
                    },
                    options: { type: [String], default: [] },
                    ban_timeout: { type: Number },
                    mute_timeout: { type: Number },
                    modify_roles: {
                        add: { type: [String], default: [] },
                        remove: { type: [String], default: [] }
                    }
                },
                swear_filter: {
                    active: { type: Boolean, default: false },
                    registry: { type: [String], default: [] },
                    options: { type: [String], default: ['ACTION_DELETE_MESSAGE'] },
                    ban_timeout: { type: Number },
                    mute_timeout: { type: Number },
                    modify_roles: {
                        add: { type: [String], default: [] },
                        remove: { type: [String], default: [] }
                    },
                    send_message: {
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
                            fields: { type: [], default: [] }
                        }
                    },
                    ignored: {
                        channels: { type: [String], default: [] },
                        roles: { type: [String], default: [] },
                        permissions: { type: [Number], default: [8] }
                    }
                },
                users_slowdown: {
                    active: { type: Boolean, default: false },
                    messages_limit: { type: Number, default: 3 },
                    options: { type: [String], default: ['ACTION_DELETE_MESSAGE'] },
                    ban_timeout: { type: Number },
                    mute_timeout: { type: Number },
                    modify_roles: {
                        add: { type: [String], default: [] },
                        remove: { type: [String], default: [] }
                    },
                    send_message: {
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
                            fields: { type: [], default: [] }
                        }
                    },
                    ignored: {
                        channels: { type: [String], default: [] },
                        roles: { type: [String], default: [] },
                        permissions: { type: [Number], default: [8] }
                    }
                }
            },
            warnings: {
                penalties: { type: [], default: [] },
                violators: { type: [], default: [] }
            },
            roles: {
                temporary: { type: [], default: [] }
            },
            tempbans: { type: [], default: [] },
            respect_hierarchy: { type: Boolean, default: true },
            deny_moderate_users_with_mp: { type: Boolean, default: true },
            unmoderated_roles: { type: [String], default: [] },
            mutes: {
                rar: { type: Boolean, default: false },
                rar_strict: { type: [String], default: [] },
                rar_data: { type: [], default: [] }
            },
            ai_mod: {
                active: { type: Boolean, default: false },
                log_channel_id: { type: String, default: null },
                ignored_channels: { type: [String], default: [] },
                ignored_roles: { type: [String], default: [] }
            },
            dame_rules: { type: [], default: [] }
        },
        modules: {
            welcome: {
                active: { type: Boolean, default: false },
                format: { type: String, default: 'DM' },
                channel_id: { type: String, default: null },
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
                        fields: { type: [], default: [] }
                    },
                    image: {
                        active: { type: Boolean, default: false },
                        height: { type: Number, default: 256 },
                        width: { type: Number, default: 720 },
                        background: {
                            color: { type: String, default: null },
                            url: { type: String, default: null }
                        },
                        elements: { type: [], default: [] }
                    }
                },
                initial_roles: {
                    active: { type: Boolean, default: false },
                    roles: { type: [String], default: [] }
                }
            },
            farewell: {
                active: { type: Boolean, default: false },
                format: { type: String, default: 'DM' },
                channel_id: { type: String, default: null },
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
                        fields: { type: [], default: [] }
                    },
                    image: {
                        active: { type: Boolean, default: false },
                        height: { type: Number, default: 256 },
                        width: { type: Number, default: 720 },
                        background: {
                            color: { type: String, default: null },
                            url: { type: String, default: null }
                        },
                        elements: { type: [], default: [] }
                    }
                }
            },
            reactions: { type: [], default: [] },
            levels: {
                active: { type: Boolean, default: false },
                voice: { type: Boolean, default: false },
                single_roles: { type: Boolean },
                reset_on_leave: { type: Boolean, default: false },
                blocked: {
                    channels: { type: [String], default: [] },
                    roles: { type: [String], default: [] }
                },
                allowed: {
                    channels: { type: [String], default: [] },
                    roles: { type: [String], default: [] }
                },
                level_up_alerts: {
                    active: { type: Boolean, default: false },
                    format: { type: String, default: 'CURRENT_CHANNEL' },
                    channel_id: { type: String, default: null },
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
                            fields: { type: [], default: [] }
                        },
                        image: {
                            active: { type: Boolean, default: false },
                            height: { type: Number, default: 256 },
                            width: { type: Number, default: 720 },
                            background: {
                                color: { type: String, default: null },
                                url: { type: String, default: null }
                            },
                            elements: { type: [], default: [] }
                        }
                    }
                },
                awards: { type: [], default: [] }
            },
            voice_manager: {
                voice_roles: { type: [], default: [] },
                autovoices: { type: [], default: [] }
            },
            restoring: {
                restore_roles: { type: Boolean, default: false },
                restore_nicknames: { type: Boolean, default: false },
                strict_roles: { type: [String], default: [] }
            },
            music: {
                allowed: {
                    channels: { type: [String], default: [] },
                    roles: { type: [String], default: [] }
                },
                blocked: {
                    channels: { type: [String], default: [] },
                    roles: { type: [String], default: [] }
                },
                queue_max_length: { type: Number, default: 15 },
                track_max_duration: { type: Number, default: 0 },
                default_volume: { type: Number, default: 100 },
                allow_radio_playback: { type: Boolean, default: false },
                disable_skip_vote: { type: Boolean, default: false },
                default_source: { type: String, default: 'YandexMusic' },
                voice_status: {
                    enabled: { type: Boolean, default: false },
                    force_set: { type: Boolean, default: false }
                }
            },
            statistics: { type: [], default: [] },
            reports: {
                active: { type: Boolean, default: false },
                channel_id: { type: String, default: null },
                notify_about_unwanted_users: { type: Boolean, default: true }
            },
            autothreads: { type: [], default: [] },
            autoreactions: { type: [], default: [] },
            economy: {
                active: { type: Boolean, default: false },
                reset_wallet_on_leave: { type: Boolean, default: false },
                currencies: {
                    type: [],
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
                    items: { type: [], default: [] }
                },
                transfer: {
                    allowed_roles: { type: [String], default: [] },
                    blocked_roles: { type: [String], default: [] }
                }
            },
            subscriptions: {
                twitch: { type: [], default: [] },
                youtube: { type: [], default: [] },
                telegram: { type: [], default: [] }
            },
            interactive_messages: { type: [], default: [] },
            custom_commands: { type: [], default: [] },
            activities: {
                multipliers: { type: [], default: [] }
            },
            automation: { type: [], default: [] },
            guild_image_rotation: {
                banner: {
                    active: { type: Boolean, default: false },
                    last_updated_timestamp: { type: Number, default: null },
                    image: {
                        active: { type: Boolean, default: true },
                        height: { type: Number, default: 540 },
                        width: { type: Number, default: 960 },
                        background: {
                            color: { type: String, default: null },
                            url: { type: String, default: '{guild.banner}' }
                        },
                        elements: { type: [], default: [] }
                    }
                }
            }
        },
        utility: {
            giveaways: { type: [], default: [] },
            polls: { type: [], default: [] }
        },
        web_page: {
            active: { type: Boolean, default: false },
            categories: { type: [Number], default: [] },
            summary: { type: String, default: null },
            description: { type: String, default: null },
            social_links: { type: [], default: [] },
            invite_code: { type: String, default: null },
            public_leaderboard: { type: Boolean, default: true }
        },
        created_at: { type: Number, default: () => Date.now() },
        change_log: { type: [], default: [] },
        logs: { type: [], default: [] }
    },
    {
        versionKey: false
    }
)

schema.static(
    'fetch',
    async function fetch(filter: FilterQuery<ServerDocument>, defaultValues: Partial<ServerDocument> = {}) {
        let document = await this.findOne(filter)

        if (!document) {
            try {
                document = await this.create({ ...filter, ...defaultValues })
            } catch (err) {
                document = null
            }
        }

        return document
    }
)

export default mongoose.model<ServerDocument, ServerModel>('servers', schema)

export interface ServerDocument extends mongoose.Document {
    _id: string
    locale: ServerLocale
    blocked: boolean
    bot_experts: string[]
    commands: ServerCommands
    moderation: ServerModeration
    modules: ServerModules
    utility: ServerUtility
    web_page: ServerWebPage
    created_at: number
    change_log: ServerChangeLog[]
    logs: ServerLogEntry[]
}

export interface ServerModel extends mongoose.Model<ServerDocument> {
    fetch(
        filter: mongoose.FilterQuery<ServerDocument>,
        defaultValues?: Partial<ServerDocument>
    ): Promise<ServerDocument>
}

export type ServerLocale = 'en' | 'ru'

export interface ServerCommands {
    configuration: ServerCommandsCommandConfig[]
}

export interface ServerCommandsCommandConfig {
    name: string
    inactive: boolean
    options: ServerCommandsCommandConfigOption[]
    permissions: {
        allowed_channels: string[]
        allowed_roles: string[]
        blocked_channels: string[]
        blocked_roles: string[]
    }
    throttling?: ServerCommandsCommandConfigThrottling
}

export type ServerCommandsCommandConfigOption = 'THROTTLING'

export interface ServerCommandsCommandConfigThrottling {
    type: ServerCommandsCommandConfigThrottlingType
    max_uses: number
    timeout: number
}

export type ServerCommandsCommandConfigThrottlingType = 'PER_GUILD' | 'PER_CHANNEL' | 'PER_USER'

export interface ServerModeration {
    case_log: ServerModerationCaseLog
    logs: ServerModerationLogs
    automoder: ServerModerationAutoMod
    warnings: ServerModerationWarnings
    roles: ServerModerationRoles
    tempbans: ServerModerationTemporaryBan[]
    use_timeout_mute: boolean
    respect_hierarchy: boolean
    deny_moderate_users_with_mp: boolean
    unmoderated_roles: string[]
    mutes: ServerModerationRolesMutes
    ai_mod: ServerModerationAIMod
    dame_rules: ServerModerationDAMERule[]
}

export interface ServerModerationCaseLog {
    cases: ServerModerationCaseLogCase[]
    case_count: number
    channel_id: string | null
    types: Record<ServerModerationCaseLogTypeKey, ServerModerationCaseLogType>
}

export interface ServerModerationCaseLogCase {
    case_id: number
    type: number | string
    timestamp: number
    reason: string
    target: ServerModerationCaseLogCaseUser
    executor: ServerModerationCaseLogCaseUser
}

export interface ServerModerationCaseLogCaseUser {
    id: string
    name: string
}

export type ServerModerationCaseLogTypeKey =
    | 'BAN_ADD'
    | 'BAN_REMOVE'
    | 'KICK'
    | 'MUTE_ADD'
    | 'MUTE_REMOVE'
    | 'PRUNE_MESSAGES'
    | 'WARN_ADD'
    | 'WARN_REMOVE'

export interface ServerModerationCaseLogType {
    active: boolean
    channel_id: string
    custom_dm_message: boolean
    dm_message: ServerMessageTemplate
}

export interface ServerMessageTemplate {
    content: string | null
    embed: ServerMessageTemplateEmbed
}

export interface ServerMessageTemplateEmbed {
    active: boolean
    title: string | null
    description: string | null
    url: string | null
    timestamp: string | null
    color: string | null
    footer: {
        text: string | null
        icon_url: string | null
    }
    image: {
        url: string | null
    }
    thumbnail: {
        url: string | null
    }
    author: {
        name: string | null
        url: string | null
        icon_url: string | null
    }
    fields: ServerMessageTemplateEmbedFields[]
}

export interface ServerMessageTemplateEmbedFields {
    name: string
    value: string
    inline?: boolean
}

export interface ServerModerationLogs {
    webhooks: ServerModerationLogsWebhook[]
    types: Record<ServerModerationLogsTypeKey, ServerModerationLogsType>
}

export interface ServerModerationLogsWebhook {
    id: string
    token: string
    channel_id: string
}

export type ServerModerationLogsTypeKey =
    | 'channel_create'
    | 'channel_delete'
    | 'channel_update'
    | 'emoji_create'
    | 'emoji_delete'
    | 'emoji_update'
    | 'guild_ban_add'
    | 'guild_ban_remove'
    | 'guild_member_add'
    | 'guild_member_remove'
    | 'guild_member_update'
    | 'guild_update'
    | 'invite_create'
    | 'invite_delete'
    | 'message_delete'
    | 'message_delete_bulk'
    | 'message_update'
    | 'role_create'
    | 'role_delete'
    | 'role_member_add'
    | 'role_member_remove'
    | 'role_update'
    | 'sticker_create'
    | 'sticker_delete'
    | 'sticker_update'
    | 'thread_create'
    | 'thread_delete'
    | 'thread_update'
    | 'user_update'
    | 'voice_connect'
    | 'voice_disconnect'
    | 'voice_move'
    | 'voice_server_mute'
    | 'voice_server_unmute'
    | 'voice_server_deaf'
    | 'voice_server_undeaf'

export interface ServerModerationLogsType {
    active: boolean
    channel_id: string | null
}

export interface ServerModerationAutoMod {
    anti_caps: ServerModerationAutoModAntiCaps
    links_filter: ServerModerationAutoModLinksFilter
    newbies: ServerModerationAutoModNewbies
    nicknames: ServerModerationAutoModNicknames
    swear_filter: ServerModerationAutoModSwearFilter
    users_slowdown: ServerModerationAutoModUsersSlowdown
}

export interface ServerModerationAutoModAntiCaps {
    active: boolean
    percentage_of_caps: number
    minimum_content_length: number
    options: ServerModerationAutoModOption[]
    ban_timeout?: number
    mute_timeout?: number
    modify_roles: ServerModerationAutoModModifyRoles
    send_message: ServerMessageTemplate
    ignored: ServerModerationAutoModIgnored
}

export type ServerModerationAutoModOption =
    | 'ACTION_BAN'
    | 'ACTION_MUTE'
    | 'ACTION_KICK'
    | 'ACTION_WARN'
    | 'ACTION_MODIFY_ROLES'
    | 'ACTION_SEND_MESSAGE'
    | 'ACTION_DELETE_MESSAGE'

export interface ServerModerationAutoModModifyRoles {
    add: string[]
    remove: string[]
}

export interface ServerModerationAutoModIgnored {
    channels: string[]
    roles: string[]
    permissions: number[]
}

export interface ServerModerationAutoModLinksFilter {
    active: boolean
    allowed_registry: string[]
    blocked_registry: string[]
    options: ServerModerationAutoModLinksFilterOption[]
    ban_timeout?: number
    mute_timeout?: number
    modify_roles: ServerModerationAutoModModifyRoles
    send_message: ServerMessageTemplate
    ignored: ServerModerationAutoModIgnored
}

export type ServerModerationAutoModLinksFilterOption =
    | ServerModerationAutoModOption
    | 'DELETE_ALL_LINKS'
    | 'DELETE_REFERRAL_INVITES'

export interface ServerModerationAutoModNewbies {
    active: boolean
    minimum_account_age: {
        value: number
        measure: 'MINUTES' | 'HOURS' | 'DAYS'
    }
    options: ServerModerationAutoModNewbiesOption[]
    ban_timeout?: number
    mute_timeout?: number
    modify_roles: ServerModerationAutoModModifyRoles
}

export type ServerModerationAutoModNewbiesOption = Exclude<
    ServerModerationAutoModOption,
    'ACTION_WARN' | 'ACTION_SEND_MESSAGE' | 'ACTION_DELETE_MESSAGE'
>

export interface ServerModerationAutoModNicknames {
    active: boolean
    options: ServerModerationAutoModNicknamesOption[]
    contains: string[]
    ignored: ServerModerationAutoModNicknamesIgnored
}

export type ServerModerationAutoModNicknamesOption = 'SPECIAL_CHARACTERS' | 'ZALGO' | 'DIACRITICS' | 'EMOJIS'

export interface ServerModerationAutoModNicknamesIgnored extends ServerModerationAutoModIgnored {
    bots: boolean
}

export interface ServerModerationAutoModSwearFilter {
    active: boolean
    registry: string[]
    options: ServerModerationAutoModOption[]
    ban_timeout?: number
    mute_timeout?: number
    modify_roles: ServerModerationAutoModModifyRoles
    send_message: ServerMessageTemplate
    ignored: ServerModerationAutoModIgnored
}

export interface ServerModerationAutoModUsersSlowdown {
    active: boolean
    messages_limit: number
    options: ServerModerationAutoModOption[]
    ban_timeout?: number
    mute_timeout?: number
    modify_roles: ServerModerationAutoModModifyRoles
    send_message: ServerMessageTemplate
    ignored: ServerModerationAutoModIgnored
}

export interface ServerModerationWarnings {
    penalties: ServerModerationWarningsPenalty[]
    violators: ServerModerationWarningsViolator[]
}

export interface ServerModerationWarningsPenalty {
    id: string
    penalties: number
    options: ServerModerationWarningsPenaltyOption[]
    ban_timeout?: number
    mute_timeout?: number
    modify_roles?: ServerModerationAutoModModifyRoles
    send_message?: ServerMessageTemplate
}

export type ServerModerationWarningsPenaltyOption =
    | Exclude<ServerModerationAutoModOption, 'ACTION_WARN' | 'ACTION_DELETE_MESSAGE'>
    | 'ACTION_RESET_VIOLATIONS'

export interface ServerModerationWarningsViolator {
    user_id: string
    violations: ServerModerationWarningsViolatorViolation[]
}

export interface ServerModerationWarningsViolatorViolation {
    id: string
    timestamp: number
    reason: string
}

export interface ServerModerationRoles {
    temporary: ServerModerationRolesTemporaryRole[]
    on_mute: ServerModerationRolesOnMute
}

export interface ServerModerationRolesTemporaryRole {
    user_id: string
    role_id: string
    unique_id: string
    expires_timestamp: number
}

export interface ServerModerationRolesOnMute {
    remove_all_roles: boolean
    strict_roles: string[]
    returnable_roles: ServerModerationRolesOnMuteReturnableRole[]
}

export interface ServerModerationRolesOnMuteReturnableRole {
    user_id: string
    roles: string[]
}

export interface ServerModerationTemporaryBan {
    user_id: string
    expires_timestamp: number
}

export interface ServerModerationRolesMutes {
    rar: boolean
    rar_strict: string[]
    rar_data: ServerModerationRolesMutesData[]
}

export interface ServerModerationRolesMutesData {
    user_id: string
    roles: string[]
}

export interface ServerModerationAIMod {
    active: boolean
    log_channel_id: string | null
    ignored_channels: string[]
    ignored_roles: string[]
}

export interface ServerModerationDAMERule {
    id: string
    name: string
    event_type: ServerModerationDAMERuleEventType
    trigger_type: ServerModerationDAMERuleTriggerType
    trigger_metadata: ServerModerationDAMERuleTriggerMetadata
    actions: ServerModerationDAMERuleAction[]
    enabled: boolean
    exempt_roles: string[]
    exempt_channels: string[]
}

export enum ServerModerationDAMERuleEventType {
    MessageSend = 1,
    MemberUpdate
}

export enum ServerModerationDAMERuleTriggerType {
    Keyword = 1,
    Spam = 3,
    KeywordPreset,
    MentionSpam,
    MemberProfile
}

export interface ServerModerationDAMERuleTriggerMetadata {
    keyword_filter?: string[]
    regex_patters?: string[]
    preset?: ServerModerationDAMERuleTriggerMetadataPreset[]
    allow_list?: string[]
    mention_total_limit?: number
    mention_raid_protection_enabled?: boolean
}

export enum ServerModerationDAMERuleTriggerMetadataPreset {
    Profanity = 1,
    SexualContent,
    Slurs
}

export interface ServerModerationDAMERuleAction {
    type: ServerModerationDAMERuleActionType
    metadata: ServerModerationDAMERuleActionMetadata
}

export enum ServerModerationDAMERuleActionType {
    BlockMessage = 1,
    SendAlertMessage,
    Timeout,
    BlockMemberInteraction,
    Ban = 101,
    Kick,
    Warn,
    ModifyRoles,
    SendMessage
}

export interface ServerModerationDAMERuleActionMetadata {
    channel_id?: string
    duration_seconds?: number
    custom_message?: string
    add_roles?: string[]
    remove_roles?: string[]
    message?: ServerMessageTemplate
}

export interface ServerModules {
    welcome: ServerModulesWelcome
    farewell: ServerModulesFarewell
    reactions: ServerModulesInteractiveReaction[]
    levels: ServerModulesLevels
    voice_manager: ServerModulesVoiceManager
    restoring: ServerModulesRestoring
    music: ServerModulesMusic
    reports: ServerModulesReports
    autothreads: ServerModulesAutoThread[]
    autoreactions: ServerModulesAutoReaction[]
    economy: ServerModulesEconomy
    subscriptions: ServerModulesSubscriptions
    interactive_messages: ServerModulesInteractiveMessage[]
    custom_commands: ServerModulesCustomCommand[]
    activities: ServerModulesActivities
    automation: ServerModulesAutomation[]
    guild_image_rotation: ServerModulesGuildImageRotation
}

export interface ServerModulesWelcome {
    active: boolean
    format: ServerModulesWelcomeFormat
    channel_id: string
    message: ServerMessageTemplateWithImage
    initial_roles: {
        active: boolean
        roles: string[]
    }
}

export type ServerModulesWelcomeFormat = 'DM' | 'CHANNEL'

export interface ServerMessageTemplateWithImage extends ServerMessageTemplate {
    image: ServerMessageTemplateImage
}

export interface ServerMessageTemplateImage {
    active: boolean
    height: number
    width: number
    background: ServerMessageTemplateImageBackground
    elements: (ServerMessageTemplateImageElementText | ServerMessageTemplateImageElementImage)[]
}

export interface ServerMessageTemplateImageBackground {
    color: string | null
    url: string | null
}

export interface ServerMessageTemplateImageElement {
    id: string
    type: ServerMessageTemplateImageElementType
    posX: number
    posY: number
    height: number
    width: number
}

export type ServerMessageTemplateImageElementType = 'TEXT' | 'IMAGE'

export interface ServerMessageTemplateImageElementText extends ServerMessageTemplateImageElement {
    type: 'TEXT'
    value: string
    color: string
    size: ServerMessageTemplateImageElementTextSize
    style: ServerMessageTemplateImageElementTextStyle
    transform: ServerMessageTemplateImageElementTextTransform
    decoration: ServerMessageTemplateImageElementTextDecoration
    align: ServerMessageTemplateImageElementTextAlign
}

export type ServerMessageTemplateImageElementTextSize = 'h4' | 'h5' | 'h6' | 'subtitle1' | 'body2' | 'caption'
export type ServerMessageTemplateImageElementTextStyle = 'normal' | 'italic'
export type ServerMessageTemplateImageElementTextTransform = 'none' | 'capitalize' | 'uppercase' | 'lowercase'
export type ServerMessageTemplateImageElementTextDecoration = 'none' | 'underline' | 'line-through'
export type ServerMessageTemplateImageElementTextAlign = 'center' | 'start' | 'end'

export interface ServerMessageTemplateImageElementImage extends ServerMessageTemplateImageElement {
    type: 'IMAGE'
    url: string
    border_radius: ServerMessageTemplateImageElementImageBorderRadius
}

export type ServerMessageTemplateImageElementImageBorderRadius = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'circle'

export interface ServerModulesFarewell {
    active: boolean
    format: ServerModulesFarewellFormat
    channel_id: string
    message: ServerMessageTemplateWithImage
}

export type ServerModulesFarewellFormat = ServerModulesWelcomeFormat

export interface ServerModulesInteractiveReaction {
    id: string
    type: ServerModulesInteractiveReactionType
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
    emoji: ServerEmoji
    references: string[]
}

export type ServerModulesInteractiveReactionType = 'CHANNEL' | 'ROLE'

export interface ServerEmoji {
    animated: boolean
    id: string
    name: string
}

export interface ServerModulesLevels {
    active: boolean
    voice: boolean
    single_roles?: boolean
    reset_on_leave: boolean
    blocked: {
        channels: string[]
        roles: string[]
    }
    allowed: {
        channels: string[]
        roles: string[]
    }
    level_up_alerts: {
        active: boolean
        format: ServerModulesLevelsAlertsFormat
        channel_id: string
        message: ServerMessageTemplateWithImage
    }
    awards: ServerModulesLevelsAward[]
}

export type ServerModulesLevelsAlertsFormat = ServerModulesWelcomeFormat | 'CURRENT_CHANNEL'

export interface ServerModulesLevelsAward {
    id: string
    type: ServerModulesLevelsAwardType
    level: number
    references: string[]
    remove_references?: string[]
    alert: {
        active: boolean
        format: ServerModulesLevelsAwardAlertFormat
        channel_id: string
        message: ServerMessageTemplate
    }
    conditions?: {
        level: number
        voice_time: number
        sent_messages: number
    }
}

export type ServerModulesLevelsAwardType = 'ROLE'

export type ServerModulesLevelsAwardAlertFormat = ServerModulesWelcomeFormat

export interface ServerModulesVoiceManager {
    voice_roles: ServerModulesVoiceManagerVoiceRole[]
    autovoices: ServerModulesVoiceManagerAutoVoice[]
}

export interface ServerModulesVoiceManagerVoiceRole {
    role_id: string
    bound_channels_id: string[]
}

export interface ServerModulesVoiceManagerAutoVoice {
    id: string
    channel_id: string
    default: {
        name: string
        limit: number
        permissions: number
        category_id: string
        position: ServerModulesVoiceManagerAutoVoicePosition
    }
    allowed_roles: string[]
    blocked_roles: string[]
    moderator_roles: string[]
    children: ServerModulesVoiceManagerAutoVoiceChild[]
}

export type ServerModulesVoiceManagerAutoVoicePosition = 'TOP' | 'BOTTOM'

export interface ServerModulesVoiceManagerAutoVoiceChild {
    channel_id: string
    owner_id: string
    created_at: number
}

export interface ServerModulesRestoring {
    restore_roles: boolean
    restore_nicknames: boolean
    strict_roles: string[]
}

export interface ServerModulesMusic {
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
    default_source: ServerModulesMusicSource
    voice_status: {
        enabled: boolean
        force_set: boolean
    }
}

export type ServerModulesMusicSource = 'YandexMusic' | 'SoundCloud'

export interface ServerModulesReports {
    active: boolean
    channel_id: string
    notify_about_unwanted_users: boolean
}

export interface ServerModulesAutoThread {
    channel_id: string
    name: string
    matches: string[]
    exclude_matches: string[]
}

export interface ServerModulesAutoReaction {
    channel_id: string
    reactions: ServerEmoji[]
    message_types: string[]
    matches: string[]
    exclude_matches: string[]
}

export interface ServerModulesEconomy {
    active: boolean
    reset_wallet_on_leave: boolean
    currencies: ServerModulesEconomyCurrency[]
    store: {
        items: ServerModulesEconomyStoreItem[]
    }
    transfer: {
        allowed_roles: string[]
        blocked_roles: string[]
    }
}

export interface ServerModulesEconomyCurrency {
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

export interface ServerModulesEconomyStoreItem {
    id: string
    name: string
    type: ServerModulesEconomyStoreItemType
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
    custom_purchase_reply?: ServerMessageTemplate
}

export type ServerModulesEconomyStoreItemType = 'CHANNEL' | 'ROLE'

export type EconomyStoreItemOptions = 'SELLABLE' | 'LIMITED_QUANTITY' | 'TEMPORARY_REFERENCES' | 'CUSTOM_PURCHASE_REPLY'

export interface ServerModulesSubscriptions {
    twitch: ServerModulesSubscriptionsTwitch[]
    youtube: ServerModulesSubscriptionsYouTube[]
    telegram: ServerModulesSubscriptionsTelegram[]
}

export interface ServerModulesSubscriptionsTwitch {
    broadcaster_id: string
    broadcaster_name: string
    broadcaster_thumbnail_url: string
    notification_channel_id: string
    notification_message: { content: string }
    webhook_id: string
    webhook_token: string
    display_stream_preview: boolean
    options?: ServerModulesSubscriptionsOption[]
}

export type ServerModulesSubscriptionsOption = 'CROSSPOST_MESSAGE' | 'CREATE_THREAD'

export interface ServerModulesSubscriptionsYouTube {
    channel_id: string
    channel_name: string
    channel_thumbnail_url: string
    notification_channel_id: string
    notification_message: { content: string }
    webhook_id: string
    webhook_token: string
    options?: ServerModulesSubscriptionsOption[]
}

export interface ServerModulesSubscriptionsTelegram {
    channel_id: number
    channel_name: string
    channel_username: string
    notification_channel_id: string
    webhook_id: string
    webhook_token: string
    options: ServerModulesSubscriptionsTelegramOption[]
    role_mentions?: string[]
}

export type ServerModulesSubscriptionsTelegramOption =
    | ServerModulesSubscriptionsOption
    | 'MENTION_EVERYONE'
    | 'MENTION_ROLES'

export interface ServerModulesInteractiveMessage {
    id: string
    channel_id: string
    message: ServerMessageTemplate
    components: (
        | ServerModulesInteractiveMessageButtonComponent
        | ServerModulesInteractiveMessageSelectMenuComponent
    )[][]
    reactions: ServerModulesInteractiveMessageReaction[]
}

export interface ServerModulesInteractiveMessageButtonComponent {
    id: string
    type: 'BUTTON'
    options: ServerModulesInteractiveMessageComponentOption[]
    appearance: {
        label: string
        style: 'PRIMARY' | 'SECONDARY' | 'SUCCESS' | 'DANGER' | 'LINK'
        emoji: ServerEmoji
        url: string
        disabled: boolean
    }
    ephemeral_reply?: ServerMessageTemplate
    modify_roles?: ServerModulesInteractiveMessageModifyRoles
    overwrite_channel_permissions?: ServerModulesInteractiveMessageOverwriteChannelPermissions
    restricted_roles?: string[]
}

export type ServerModulesInteractiveMessageComponentOption =
    | 'EPHEMERAL_REPLY'
    | 'MODIFY_ROLES'
    | 'OVERWRITE_CHANNEL_PERMISSIONS'
    | 'RESTRICT_ROLES'

export interface ServerModulesInteractiveMessageModifyRoles {
    add: string[]
    remove: string[]
    reversible_add: boolean
    reversible_remove: boolean
    duration: number
}

export interface ServerModulesInteractiveMessageOverwriteChannelPermissions {
    channels: string[]
    permissions: Record<string, boolean>
    reversible: boolean
}

export interface ServerModulesInteractiveMessageSelectMenuComponent {
    id: string
    type: 'SELECT_MENU'
    placeholder: string
    _options: ServerModulesInteractiveMessageSelectMenuComponentOption[]
    disabled: boolean
}

export interface ServerModulesInteractiveMessageSelectMenuComponentOption {
    options: ServerModulesInteractiveMessageComponentOption[]
    appearance: {
        label: string
        value: string
        description: string
        emoji: ServerEmoji
    }
    ephemeral_reply?: ServerMessageTemplate
    modify_roles?: ServerModulesInteractiveMessageModifyRoles
    overwrite_channel_permissions?: ServerModulesInteractiveMessageOverwriteChannelPermissions
    restricted_roles?: string[]
}

export interface ServerModulesInteractiveMessageReaction {
    id: string
    options: ServerModulesInteractiveMessageReactionOption[]
    emoji: ServerEmoji
    modify_roles?: ServerModulesInteractiveMessageModifyRoles
    overwrite_channel_permissions?: ServerModulesInteractiveMessageOverwriteChannelPermissions
    restricted_roles?: string[]
}

export type ServerModulesInteractiveMessageReactionOption =
    | 'MODIFY_ROLES'
    | 'OVERWRITE_CHANNEL_PERMISSIONS'
    | 'RESTRICT_ROLES'

export type ServerModulesCustomCommand = {
    id: string
    options: ServerModulesCustomCommandOptions[]
    command: {
        type: number
        name: string
        description: string
        name_localizations?: Record<string, string>
        description_localizations?: Record<string, string>
        options: ServerModulesCustomCommandDataOption[]
    }
    throttling?: ServerCommandsCommandConfigThrottling
} & (ServerModulesCustomCommandWithScripts | ServerModulesCustomCommandWithComponents)

export enum ServerModulesCustomCommandOptions {
    Throttling = 'THROTTLING'
}

export interface ServerModulesCustomCommandDataOption {
    type: ServerModulesCustomCommandDataOptionType
    name: string
    description: string
    name_localizations?: Record<string, string>
    description_localizations?: Record<string, string>
    required: boolean
    choices: ServerModulesCustomCommandDataOptionChoice[]
    channel_types?: ServerModulesCustomCommandDataOptionChannelTypes[]
    min_value?: number
    max_value?: number
}

export enum ServerModulesCustomCommandDataOptionType {
    String = 3,
    Integer,
    Boolean,
    User,
    Channel,
    Role,
    Mentionable,
    Number
}

export interface ServerModulesCustomCommandDataOptionChoice {
    name: string
    name_localizations?: {
        [key: string]: string
    }
    value: string | number
}

export type ServerModulesCustomCommandDataOptionChannelTypes =
    | 'GUILD_TEXT'
    | 'GUILD_VOICE'
    | 'GUILD_CATEGORY'
    | 'GUILD_NEWS'

export interface ServerModulesCustomCommandWithScripts {
    scripts: ServerModulesCustomCommandScript[]
}

export interface ServerModulesCustomCommandScript {
    name: string | null
    language: ServerModulesCustomCommandScriptLanguages
    code: string
}

export enum ServerModulesCustomCommandScriptLanguages {
    JavaScript = 1,
    Lighthon
}

export interface ServerModulesCustomCommandWithComponents {
    components: ServerModulesCustomCommandComponent[]
}

export interface ServerModulesCustomCommandComponent {
    type: ServerModulesCustomCommandComponentTypes
    condition?: ServerModulesCustomCommandComponentCondition
    action?: ServerModulesCustomCommandComponentAction
}

export enum ServerModulesCustomCommandComponentTypes {
    Condition = 'CONDITION',
    Action = 'ACTION'
}

export interface ServerModulesCustomCommandComponentCondition {
    type: ServerModulesCustomCommandComponentConditionTypes
    compare_values?: ServerModulesCustomCommandComponentConditionCompareValues
}

export enum ServerModulesCustomCommandComponentConditionTypes {
    CompareValues = 'COMPARE_VALUES'
}

export interface ServerModulesCustomCommandComponentConditionCompareValues {
    options: ServerModulesCustomCommandComponentConditionCompareValuesOptions[]
    operator: ServerModulesCustomCommandComponentConditionCompareValuesOperators
    left: string
    right: string
    false_reply: ServerMessageTemplate | null
}

export enum ServerModulesCustomCommandComponentConditionCompareValuesOptions {
    FalseReply = 'FALSE_REPLY',
    FalseReplyEphemeral = 'FALSE_REPLY_EPHEMERAL'
}

export enum ServerModulesCustomCommandComponentConditionCompareValuesOperators {
    Equal = 'EQUAL',
    NotEqual = 'NOT_EQUAL',
    GreaterThan = 'GREATER_THAN',
    LessThan = 'LESS_THAN',
    StartsWith = 'STARTS_WITH',
    EndsWith = 'ENDS_WITH',
    Contains = 'CONTAINS',
    NotContains = 'NOT_CONTAINS'
}

export interface ServerModulesCustomCommandComponentAction {
    type: ServerModulesCustomCommandComponentActionTypes
    execute_code?: {
        code: string
    }
    reply?: {
        options: ServerModulesCustomCommandComponentActionReplyOptions[]
        message: ServerMessageTemplate
    }
    send_message?: {
        options: ServerModulesCustomCommandComponentActionSendMessageOptions[]
        format: ServerModulesCustomCommandComponentActionSendMessageFormats
        channel_id: string
        message: ServerMessageTemplate
    }
    modify_roles?: {
        add: string[]
        remove: string[]
        user_id: string
    }
    forward_to_command?: string
    modify_wallet?: {
        amount: string
        user_id?: string
        currency_id?: string
    }
    show_modal?: {
        title: string
        customId: string
        components: any[][]
    }
    overwrite_channel_permissions?: {
        channels: string[]
        permissions: {
            [key: string]: boolean
        }
        user_or_role: string
    }
}

export enum ServerModulesCustomCommandComponentActionTypes {
    Reply = 'REPLY',
    SendMessage = 'SEND_MESSAGE',
    ModifyRoles = 'MODIFY_ROLES',
    ForwardToCommand = 'FORWARD_TO_COMMAND',
    ModifyWallet = 'MODIFY_WALLET',
    ExecuteCode = 'EXECUTE_CODE',
    ShowModal = 'SHOW_MODAL',
    OverwriteChannelPermissions = 'OVERWRITE_CHANNEL_PERMISSIONS'
}

export enum ServerModulesCustomCommandComponentActionReplyOptions {
    Ephemeral = 'EPHEMERAL'
}

export enum ServerModulesCustomCommandComponentActionSendMessageOptions {
    TTS = 'TTS'
}

export enum ServerModulesCustomCommandComponentActionSendMessageFormats {
    Channel = 'CHANNEL',
    CurrentChannel = 'CURRENT_CHANNEL'
}

export interface ServerModulesActivities {
    multipliers: ServerModulesActivitiesMultiplier[]
}

export interface ServerModulesActivitiesMultiplier {
    id: string
    options: ServerModulesActivitiesMultiplierOption[]
    allowed_channels: string[]
    allowed_roles: string[]
    blocked_channels: string[]
    blocked_roles: string[]
    levels_text_multiplier?: number
    levels_voice_multiplier?: number
    economy_text_multiplier?: number
    economy_voice_multiplier?: number
}

export type ServerModulesActivitiesMultiplierOption = 'LEVELS_TEXT' | 'LEVELS_VOICE' | 'ECONOMY_TEXT' | 'ECONOMY_VOICE'

export type ServerModulesAutomation = {
    id: string
    name: string
    options: ServerModulesAutomationOptions[]
    trigger: ServerModulesAutomationTriggers
} & (ServerModulesAutomationWithScripts | ServerModulesAutomationWithComponents)

export enum ServerModulesAutomationOptions {
    Disabled = 'DISABLED'
}

export enum ServerModulesAutomationTriggers {
    GuildMemberAdd = 'GUILD_MEMBER_ADD',
    GuildMemberRemove = 'GUILD_MEMBER_REMOVE',
    InteractionButton = 'INTERACTION_BUTTON',
    InteractionSelectMenu = 'INTERACTION_SELECT_MENU',
    InteractionModalSubmit = 'INTERACTION_MODAL_SUBMIT',
    MessageCreate = 'MESSAGE_CREATE',
    MessageDelete = 'MESSAGE_DELETE',
    MessageReactionAdd = 'MESSAGE_REACTION_ADD',
    MessageReactionRemove = 'MESSAGE_REACTION_REMOVE',
    MessageUpdate = 'MESSAGE_UPDATE',
    RoleMemberAdd = 'ROLE_MEMBER_ADD',
    RoleMemberRemove = 'ROLE_MEMBER_REMOVE',
    VoiceConnect = 'VOICE_CONNECT',
    VoiceDisconnect = 'VOICE_DISCONNECT'
}

export interface ServerModulesAutomationWithScripts extends ServerModulesCustomCommandWithScripts {}

export interface ServerModulesAutomationWithComponents extends ServerModulesCustomCommandWithComponents {}

export interface ServerModulesAutomationComponent extends ServerModulesCustomCommandComponent {}

export interface ServerModulesGuildImageRotation {
    banner: ServerModulesGuildImageRotationBanner
}

export interface ServerModulesGuildImageRotationBanner {
    active: boolean
    last_updated_timestamp: number | null
    image: ServerMessageTemplateImage
}

export interface ServerUtility {
    giveaways: ServerUtilityGiveaway[]
    polls: ServerUtilityPoll[]
}

export interface ServerUtilityGiveaway {
    message_id: string
    channel_id: string
    guild_id: string
    prize: string
    expires_at: number
    number_of_winners: number
    participants: string[]
}

export interface ServerUtilityPoll {
    message_id: string
    channel_id: string
    poll_question: string
    answer_options: ServerUtilityPollAnswerOption[]
    quiz: boolean
    multiple_answers: boolean
}

export interface ServerUtilityPollAnswerOption {
    title: string
    index: number
    voters: string[]
    correct?: boolean
}

export interface ServerWebPage {
    active: boolean
    categories: ServerWebPageCategory[]
    summary: string | null
    description: string | null
    social_links: ServerWebPageSocialLink[]
    invite_code: string | null
    public_leaderboard: boolean
}

export enum ServerWebPageCategory {
    Anime,
    Art,
    Books,
    Business,
    Comics,
    Crypto,
    CustomerSupport,
    Education,
    Entertainment,
    Esports,
    Events,
    Fandom,
    Finance,
    GameDevelopment,
    Gaming,
    GeneralChatting,
    Memes,
    Movies,
    Music,
    News,
    Podcasts,
    Programming,
    Roleplay,
    Science,
    Sports,
    Subreddit,
    Technologies,
    Travel,
    Wiki
}

export interface ServerWebPageSocialLink {
    type: ServerWebPageSocialLinkType
    url: string
}

export enum ServerWebPageSocialLinkType {
    Steam,
    YouTube,
    Twitch,
    Reddit,
    Twitter,
    Telegram,
    GitHub,
    Instagram,
    Patreon,
    Boosty
}

export interface ServerChangeLog {
    user_id: string
    changes: string[]
    timestamp: number
}

export interface ServerLogEntry {
    level: ServerLogEntryLevel
    timestamp: number
    module: string
    action?: string
    message: string
}

export type ServerLogEntryLevel = 'LOG' | 'INFO' | 'WARN' | 'ERROR'
