const Qiwi = require('../utility/Qiwi')
const db = require('../../database/DatabaseManager')
const { v4: idv4 } = require('uuid')

class QiwiBill {
    /**
     * @param {import('../Typings').BillObject} data
     */
    constructor(data) {
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

        await db.users.update({ _id: this.custom_fields.user_id }, {
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
                }
            }
        })

        return bill
    }
}

module.exports = QiwiBill