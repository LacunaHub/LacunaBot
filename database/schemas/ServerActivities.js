const { Schema, model } = require('mongoose')

const ServerActivity = new Schema({
    _id: { type: String },
    levels: { type: Array, default: [] }
}, { versionKey: false })

module.exports = model('ServerActivities', ServerActivity)