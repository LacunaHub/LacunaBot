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
    balance: { type: Number, default: 0 },
    created_at: { type: Number, default: 0 }
})

module.exports = model('Users', User)