import fetch from 'node-fetch'
import moment from 'moment'
import { scheduleJob, RecurrenceRule, Range, Job } from 'node-schedule'
import db from '../../database'
import Diamonder from '../structures/Diamonder'
import logger from '../Logger'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { sharding } from '../../index'

const rest: REST = new REST({ version: '9' }).setToken(process.env.CLIENT_TOKEN)

async function createBill(data: BillData) {
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

async function getBill(bill_id: string) {
    const res = await fetch(`https://api.qiwi.com/partner/bill/v1/bills/${bill_id}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${process.env.QIWI_SECRET_KEY}`,
            'Accept': 'application/json'
        }
    })

    return await res.json().catch(() => {})
}

export function syncBills(): Job {
    const rule = new RecurrenceRule()
    rule.minute = new Range(0, 59, 5)

    const job = scheduleJob(rule, async () => {
        const users = await db.users.find({ 'bills.status.value': 'WAITING' })

        const bills: Bill[] = []

        for (const user of users) bills.push(...user.bills.filter(bill => bill.status.value === 'WAITING'))

        for (const bill of bills) {
            const update = await getBill(bill.bill_id)

            await db.users.updateOne({ _id: bill.custom_fields.user_id, 'bills.bill_id': bill.bill_id }, {
                $set: {
                    'bills.$.status.value': update.status.value,
                    'bills.$.status.changed_timestamp': new Date(update.status.changedDateTime).getTime()
                }
            })

            if (update.status.value == 'PAID') {
                const server = await db.servers.findOne({ _id: bill.custom_fields.reference_id })

                const { diamondPrices } = await db.json.get()

                const months = diamondPrices.find(p => p.price == bill.amount.value)?.months ?? 0

                if (months > 0) {
                    const period = server.server.premium.will_expire_on ? moment(server.server.premium.will_expire_on).add(months, 'M').valueOf() : moment().add(months, 'M').valueOf()

                    await db.servers.updateOne({ _id: bill.custom_fields.reference_id }, {
                        $set: {
                            'server.premium.available': true,
                            'server.premium.will_expire_on': period
                        }
                    })

                    await rest.put(Routes.guildMemberRole('740586549145763960', bill.custom_fields.user_id, bill.amount.value > 500 ? '896416992079265824' : '746825813806284866')).catch(() => {})

                    new Diamonder(sharding, bill.custom_fields.reference_id, period)
                }
            }
        }
    })
    
    logger.info('Sync for Qiwi bills initialized')

    return job
}

export interface Bill {
    bill_id: string
    site_id: string
    amount: {
        value: number
        currency: string
    }
    status: {
        value: 'WAITING' | 'PAID' | 'REJECTED' | 'EXPIRED'
        changed_timestamp: number
    }
    custom_fields: CustomFieldsObject
    customer?: {
        email?: string
        phone?: string
        account?: string
    }
    comment?: string
    creation_timestamp: number
    pay_url: string
    expiration_timestamp: number
}

export interface BillData {
    bill_id?: string
    amount: AmountObject
    expiration_timestamp?: number
    custom_fields: CustomFieldsObject
}

export interface AmountObject {
    value: string
    currency: 'RUB' | 'KZT' | string
}

export interface CustomFieldsObject {
    type: string
    reference_id: string
    user_id: string
    pay_sources_filter?: string
    theme_code?: string
}

export default {
    createBill,
    getBill,
    syncBills
}