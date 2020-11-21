const { Schema, model } = require('mongoose')

const ServerActivity = new Schema({
    _id: { type: String },
    levels: { type: Array, default: [] },
    created_at: { type: Number, default: 0 }
}, { versionKey: false })

module.exports = model('ServerActivities', ServerActivity)