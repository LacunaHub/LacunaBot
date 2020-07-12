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
            member_add: {
                active: { type: Boolean, default: false },
                channel_id: { type: String, default: '' }
            },
            member_remove: {
                active: { type: Boolean, default: false },
                channel_id: { type: String, default: '' }
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
            format: { type: Number, default: 0 },
            channel_id: { type: String, default: '' },
            message: {
                content: { type: String, default: '' }
            }
        },
        farewell: {
            active: { type: Boolean, default: false },
            format: { type: Number, default: 0 },
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
            temporary_voice_channels: {
                triggers: { type: Array, default: [] }
            }
        },
        restoring: {
            restore_roles: { type: Boolean, default: false },
            restore_nicknames: { type: Boolean, default: false },
            strict_roles: { type: Array, default: [] },
            data: { type: Array, default: [] }
        }
    },
    created_at: { type: Number, default: 0 }
}, { versionKey: false })

module.exports = model('Servers', Server)