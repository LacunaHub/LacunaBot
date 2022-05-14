import moment from 'moment'
import fetch from 'node-fetch'
import { Job, Range, RecurrenceRule, scheduleJob } from 'node-schedule'
import { v4 as idv4 } from 'uuid'
import db from '../../database'
import { sharding } from '../../index'
import logger from '../Logger'
import DiamondGuild from '../structures/DiamondGuild'
import Patron from '../structures/Patron'
import discord from './DiscordUtils'

export class Bill {
    public bill_id: string
    public amount: BillData['amount']
    public expiration_timestamp: number
    public custom_fields: BillData['custom_fields']
    public comment: string

    constructor(data: BillData) {
        this.bill_id = idv4()

        this.amount = data.amount

        this.expiration_timestamp = data.expiration_timestamp ?? Date.now() + 3600000

        this.custom_fields = data.custom_fields

        this.comment = data.comment
    }

    async get() {
        return getBill(this.bill_id)
    }

    async create() {
        const bill = await createBill(this)

        await db.bills.create({
            _id: bill.billId,
            type: 'QIWI',
            amount: Math.round(bill.amount.value),
            currency: bill.amount.currency,
            status: {
                value: bill.status.value,
                changed_timestamp: new Date(bill.status.changedDateTime).getTime()
            },
            custom_fields: {
                type: bill.customFields.type,
                reference_id: bill.customFields.reference_id,
                user_id: bill.customFields.user_id,
                tier: Number(bill.customFields.tier)
            },
            comment: bill.comment,
            creation_timestamp: new Date(bill.creationDateTime).getTime(),
            expiration_timestamp: new Date(bill.expirationDateTime).getTime()
        } as any)

        return bill
    }
}

async function createBill(data: BillData): Promise<APIBill> {
    return fetch(`https://api.qiwi.com/partner/bill/v1/bills/${data.bill_id}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${process.env.QIWI_SECRET_KEY}`,
            'Content-Type': 'application/json;charset=UTF-8',
            Accept: 'application/json'
        },
        body: JSON.stringify({
            amount: data.amount,
            comment: data.comment,
            expirationDateTime: moment(data.expiration_timestamp).format(),
            customFields: { ...data.custom_fields, themeCode: 'Danyiar-KKG8jy-URP' }
        })
    })
        .then(response => {
            return response.json()
        })
        .catch(err => {
            throw new Error(err)
        })
}

async function getBill(bill_id: string): Promise<APIBill> {
    return fetch(`https://api.qiwi.com/partner/bill/v1/bills/${bill_id}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${process.env.QIWI_SECRET_KEY}`,
            Accept: 'application/json'
        }
    })
        .then(response => {
            return response.json()
        })
        .catch(err => {
            throw new Error(err)
        })
}

export function syncBills(): Job {
    const rule = new RecurrenceRule()
    rule.minute = new Range(0, 59, 2)

    const job = scheduleJob(rule, async () => {
        const bills = await db.bills.find({ 'status.value': 'WAITING' })

        for (const bill of bills) {
            const update = await getBill(bill._id)

            await db.bills.updateOne(
                { _id: bill._id },
                {
                    $set: {
                        'status.value': update.status.value,
                        'status.changed_timestamp': new Date(update.status.changedDateTime).getTime()
                    }
                }
            )

            if (update.status.value == 'PAID') {
                const server = await db.servers.findOne({ _id: bill.custom_fields.reference_id })
                const { diamondPrices } = await db.json.get()
                const months = diamondPrices[bill.custom_fields.tier]?.months ?? 0

                if (months > 0) {
                    const period = server.server.premium.will_expire_on
                        ? moment(server.server.premium.will_expire_on).add(months, 'M').valueOf()
                        : moment().add(months, 'M').valueOf()

                    await db.servers.updateOne(
                        { _id: bill.custom_fields.reference_id },
                        {
                            $set: {
                                'server.premium.available': true,
                                'server.premium.will_expire_on': period
                            }
                        }
                    )

                    const diamondGuild = sharding.diamondGuilds.get(bill.custom_fields.reference_id)
                    if (diamondGuild) diamondGuild.cancel()

                    new DiamondGuild(sharding, bill.custom_fields.reference_id, period)

                    await db.users.updateOne(
                        { _id: bill.custom_fields.user_id },
                        {
                            $set: {
                                'premium.available': true,
                                'premium.expiration_timestamp': period,
                                'premium.last_charge_timestamp': Date.now()
                            }
                        }
                    )

                    const support_server_id = '740586549145763960',
                        patron_roles = ['968097093388468274']

                    patron_roles.push(bill.amount > 500 ? '896416992079265824' : '746825813806284866')

                    for (const role of patron_roles) {
                        await discord.restApi.put(discord.apiRoutes.guildMemberRole(support_server_id, bill.custom_fields.user_id, role)).catch(() => {})
                    }

                    const patron = sharding.patrons.get(bill.custom_fields.user_id)
                    if (patron) patron.cancel()

                    new Patron(sharding, bill.custom_fields.user_id, period)
                }
            }
        }
    })

    logger.info('Sync for Qiwi bills initialized')

    return job
}

export interface BillData {
    bill_id?: string
    amount: {
        value: number
        currency: 'RUB' | 'KZT' | string
    }
    expiration_timestamp?: number
    custom_fields: {
        type: string
        reference_id: string
        user_id: string
        tier: number
    }
    comment: string
}

export interface APIBill {
    siteId: string
    billId: string
    amount: {
        value: number
        currency: 'RUB' | 'KZT' | string
    }
    status: {
        value: BillStatus
        changedDateTime: string
    }
    customFields: {
        type: string
        reference_id: string
        user_id: string
        tier: number
        themeCode?: string
    }
    customer?: {
        email?: string
        phone?: string
        account?: string
    }
    comment: string
    creationDateTime: string
    expirationDateTime: string
    payUrl: string
}

export type BillStatus = 'WAITING' | 'PAID' | 'REJECTED' | 'EXPIRED'
