const { Schema, model } = require('mongoose')

const Utility = new Schema({
    charts: {
        guilds: { type: Array, default: [] },
        latencies: { type: Array, default: [] }
    }
}, { versionKey: false })

module.exports = model('utility', Utility, 'utility')