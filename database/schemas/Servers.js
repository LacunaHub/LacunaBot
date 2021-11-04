const { model, Schema } = require('mongoose')

const Server = new Schema({
    _id: { type: String },
    locale: { type: String, default: 'ru' },
    prefix: { type: String, default: '!' },
    server: {
        premium: {
            available: { type: Boolean, default: false },
            will_expire_on: { type: Number, default: 0 },
            booster_id: { type: String, default: null }
        },
        blocked: { type: Boolean, default: false },
        bot_experts: { type: Array, default: [] }
    },
    commands: {
        system: { type: Array, default: [] },
        custom: { type: Array, default: [] },
        permissions: {
            allowed: {
                channels: { type: Array, default: [] },
                roles: { type: Array, default: [] }
            },
            blocked: {
                channels: { type: Array, default: [] },
                roles: { type: Array, default: [] }
            }
        },
        slash_commands: { type: Boolean, default: false }
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
        tempmutes: { type: Array, default: [] }
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
            temp_voice_channels: {
                triggers: { type: Array, default: [] }
            }
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
            channel_id: { type: String, default: '' },
            emoji: {
                animated: { type: Boolean, default: false },
                id: { type: String, default: '' },
                name: { type: String, default: '' }
            },
            minimum: { type: Number, default: 3 }
        },
        twitch: {
            custom_client_id: { type: String, default: '' },
            channels: { type: Array, default: [] }
        },
        youtube: {
            custom_api_key: { type: String, default: '' },
            channels: { type: Array, default: [] }
        },
        autoreactions: { type: Array, default: [] }
    },
    utility: {
        giveaways: { type: Array, default: [] }
    },
    created_at: { type: Number, default: 0 },
    modified_at: { type: Number, default: 0 },
    activity_ping_at: { type: Number, default: 0 }
}, { versionKey: false })

module.exports = model('Servers', Server)