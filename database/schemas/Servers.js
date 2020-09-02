const { model, Schema } = require('mongoose')

const Server = new Schema({
    _id: { type: String },
    locale: { type: String, default: 'ru' },
    prefix: { type: String, default: '/' },
    server: {
        premium: {
            available: { type: Boolean, default: false },
            will_expire_on: { type: Number, default: 0 }
        },
        blocked: { type: Boolean, default: false }
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
        }
    },
    moderation: {
        case_log: {
            cases: { type: Array, default: [] },
            channel_id: { type: String, default: '' }
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
                    warn_message: { type: String, default: '' }
                },
                ignored: {
                    channels: { type: Array, default: [] },
                    roles: { type: Array, default: [] }
                }
            }
        },
        warnings: {
            penalties: { type: Array, default: [] },
            violators: { type: Array, default: [] }
        },
        roles: {
            mute: { type: String, default: '' }
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
                content: { type: String, default: '' }
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
                content: { type: String, default: '' }
            }
        },
        reactions: { type: Array, default: [] },
        levels: {
            active: { type: Boolean, default: false },
            single_roles: { type: Boolean, default: false },
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
                format: { type: Number, default: 0 },
                channel_id: { type: String, default: '' },
                message: {
                    content: { type: String, default: '' },
                    embed: { type: Object, default: {} }
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
            queue_max_length: { type: Number, default: 0 },
            track_max_duration: { type: Number, default: 0 },
            default_volume: { type: Number, default: 100 },
            allow_radio_playback: { type: Boolean, default: true },
            disable_skip_vote: { type: Boolean, default: false }
        }
    },
    created_at: { type: Number, default: 0 },
    modified_at: { type: Number, default: 0 },
    activity_ping_at: { type: Number, default: 0 }
}, { versionKey: false })

module.exports = model('Servers', Server)