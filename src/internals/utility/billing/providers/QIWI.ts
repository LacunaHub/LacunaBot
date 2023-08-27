import moment from 'moment'
import fetch from 'node-fetch'
import { Job, Range, RecurrenceRule, scheduleJob } from 'node-schedule'
import { v4 as idv4 } from 'uuid'
import { addDiamond } from '..'
import db from '../../../../database'
import logger from '../../../Logger'

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
        const bills = await db.bills.find({ type: 'QIWI', 'status.value': 'WAITING' })

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

                await addDiamond(bill, server)
            }
        }
    })

    logger.info('[Qiwi] Bills sync was scheduled')

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
