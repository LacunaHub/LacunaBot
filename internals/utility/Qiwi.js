const fetch = require('node-fetch')
const moment = require('moment')
const { scheduleJob, RecurrenceRule, Range } = require('node-schedule')
const db = require('../../database/DatabaseManager')
const Diamonder = require('../structures/Diamonder')
const logger = require('../Logger')
const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')

const rest = new REST({ version: '9' }).setToken(process.env.CLIENT_TOKEN)

/**
 * @param {import('../Typings').BillObject} data
 */
async function createBill(data) {
    const res = await fetch(`https://api.qiwi.com/partner/bill/v1/bills/${data.bill_id}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${process.env.QIWI_SECRET_KEY}`,
            'Content-Type': 'application/json;charset=UTF-8',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            amount: data.amount,
            comment: `${data.custom_fields.type}:${data.custom_fields.reference_id}`,
            expirationDateTime: moment(data.expiration_timestamp).format(),
            customFields: { ...data.custom_fields, themeCode: '' }
        })
    })

    return await res.json().catch(() => {})
}

/**
 * @param {string} bill_id
 */
async function getBill(bill_id) {
    const res = await fetch(`https://api.qiwi.com/partner/bill/v1/bills/${bill_id}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${process.env.QIWI_SECRET_KEY}`,
            'Accept': 'application/json'
        }
    })

    return await res.json().catch(() => {})
}

async function syncBills() {
    const rule = new RecurrenceRule()
    rule.minute = new Range(0, 59, 5)

    const job = scheduleJob(rule, async () => {
        const users = await db.users.findSome({ 'bills.status.value': 'WAITING' })

        /**
         * @type {import('../Typings').Bill[]}
         */
        const bills = []

        for (const user of users) bills.push(...user.bills.filter(bill => bill.status.value === 'WAITING'))

        for (const bill of bills) {
            const update = await getBill(bill.bill_id)

            await db.users.update({ _id: bill.custom_fields.user_id, 'bills.bill_id': bill.bill_id }, {
                $set: {
                    'bills.$.status.value': update.status.value,
                    'bills.$.status.changed_timestamp': new Date(update.status.changedDateTime).getTime()
                }
            })

            if (update.status.value == 'PAID') {
                const server = await db.servers.find({ _id: bill.custom_fields.reference_id })

                delete require.cache[require.resolve('../../database/prices.json')]
                const prices = require('../../database/prices.json')

                const months = prices.find(p => p.price == bill.amount.value)?.months ?? 0

                if (months > 0) {
                    const period = server.server.premium.will_expire_on ? moment(server.server.premium.will_expire_on).add(months, 'M').valueOf() : moment().add(months, 'M').valueOf()

                    await db.servers.update({ _id: bill.custom_fields.reference_id }, {
                        $set: {
                            'server.premium.available': true,
                            'server.premium.will_expire_on': period
                        }
                    })

                    await rest.put(Routes.guildMemberRole(bill.custom_fields.reference_id, bill.custom_fields.user_id, bill.amount.value > 500 ? '896416992079265824' : '746825813806284866')).catch(() => {})

                    new Diamonder(bill.custom_fields.reference_id, period)
                }
            }
        }
    })
    
    logger.info('Sync for Qiwi bills initialized')

    return job
}

module.exports = { createBill, getBill, syncBills }