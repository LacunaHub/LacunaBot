const { model, Schema } = require('mongoose')

const User = new Schema({
    _id: { type: String },
    flags: { type: Number, default: 0 },
    user: {
        username: { type: String, default: '' },
        discriminator: { type: String, default: '' },
        avatar: { type: String, default: '' },
        flags: { type: Number, default: 0 }
    },
    profile: {
        name: { type: String, default: '' },
        gender: { type: Number, default: 0 },
        birth_date: { type: Number, default: 0 },
        bio: { type: String, default: '' },
        views: { type: Number, default: 0 },
        upvoters: { type: Array, default: [] }
    },
    bills: { type: Array, default: [] },
    created_at: { type: Number, default: 0 },
    modified_at: { type: Number, default: 0 }
}, { versionKey: false })

module.exports = model('Users', User)