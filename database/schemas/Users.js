const { model, Schema } = require('mongoose')

const User = new Schema({
    _id: { type: String },
    flags: { type: Number, default: 0 },
    profile: {
        name: { type: String, default: '' },
        gender: { type: Number, default: 0 },
        birth_date: { type: Number, default: 0 },
        bio: { type: String, default: '' },
        views: { type: Number, default: 0 },
        upvoters: { type: Array, default: [] }
    },
    boost: {
        available: { type: Boolean, default: false },
        type: { type: String, default: 'NONE' },
        tier: { type: Number, default: 0 },
        guilds: { type: Array, default: [] }
    },
    created_at: { type: Number, default: Date.now() },
    modified_at: { type: Number, default: 0 }
})

module.exports = model('Users', User)