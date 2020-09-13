const { Schema, model } = require('mongoose')

const Patron = new Schema({
    _id: { type: String },
    name: { type: String, default: '' },
    user_id: { type: String, default: '' },
    email: { type: String, default: '' },
    discord_id: { type: String, default: '' },
    last_charge_date: { type: String, default: '' },
    will_pay_amount_cents: { type: Number, default: 0 },
    lifetime_support_cents: { type: Number, default: 0 },
    patron_status: { type: String, default: '' },
    image_url: { type: String, default: '' },
    last_check_at: { type: Number, default: 0 }
}, { versionKey: false })

module.exports = model('Patrons', Patron)