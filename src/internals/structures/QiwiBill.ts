import Qiwi, { BillData } from '../utility/Qiwi'
import db from '../../database'
import { v4 as idv4 } from 'uuid'

export default class QiwiBill {
    public bill_id: string
    public amount: BillData['amount']
    public expiration_timestamp: number
    public custom_fields: BillData['custom_fields']

    constructor(data: BillData) {
        this.bill_id = idv4()

        this.amount = data.amount

        this.expiration_timestamp = Date.now() + 3600000

        this.custom_fields = data.custom_fields
    }

    async get() {
        return await Qiwi.getBill(this.bill_id)
    }

    async create() {
        const bill = await Qiwi.createBill(this)

        await db.users.updateOne({ _id: this.custom_fields.user_id }, {
            $push: {
                bills: {
                    bill_id: bill.billId,
                    site_id: bill.siteId,
                    amount: {
                        value: Math.round(bill.amount.value),
                        currency: bill.amount.currency
                    },
                    status: {
                        value: bill.status.value,
                        changed_timestamp: new Date(bill.status.changedDateTime).getTime()
                    },
                    custom_fields: {
                        type: bill.customFields.type,
                        reference_id: bill.customFields.reference_id,
                        user_id: bill.customFields.user_id
                    },
                    comment: bill.comment,
                    creation_timestamp: new Date(bill.creationDateTime).getTime(),
                    pay_url: `${bill.payUrl}&successUrl=${encodeURIComponent(`${process.env.WEBSITE_URL}/guilds/${bill.customFields.reference_id}/settings`)}`,
                    expiration_timestamp: new Date(bill.expirationDateTime).getTime()
                } as never
            }
        })

        return bill
    }
}