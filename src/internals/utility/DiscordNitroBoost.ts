import { APIGuildMember } from 'discord.js'
import { v4 as idv4 } from 'uuid'
import database from '../../database'
import { addDiamond, server_booster_role_id, support_server_id } from './BillUtils'
import { apiRoutes, restApi } from './DiscordUtils'
import { OrderData } from './PayPal'

export class NitroBoost {
    public bill_id: string
    public amount: OrderData['amount']
    public custom_fields: OrderData['custom_fields']

    constructor(data: OrderData) {
        this.bill_id = idv4()

        this.amount = data.amount

        this.custom_fields = data.custom_fields
    }

    async create() {
        const nitroBooster = await isNitroBooster(this.custom_fields.user_id)

        if (nitroBooster) {
            const activeBill = await database.bills.findOne({
                'custom_fields.user_id': this.custom_fields.user_id,
                type: 'DISCORD_NITRO_BOOST',
                'status.value': { $ne: 'REJECTED' }
            })

            if (activeBill) return false

            const bill = await database.bills.create({
                _id: this.bill_id,
                type: 'DISCORD_NITRO_BOOST',
                amount: Number(this.amount.value),
                currency: this.amount.currency,
                status: {
                    value: 'PAID',
                    changed_timestamp: Date.now()
                },
                custom_fields: {
                    type: this.custom_fields.type,
                    reference_id: this.custom_fields.reference_id,
                    user_id: this.custom_fields.user_id,
                    tier: Number(this.custom_fields.tier)
                },
                comment: null,
                creation_timestamp: Date.now()
            } as any)

            await addDiamond(bill)
        }

        return nitroBooster
    }
}

export async function isNitroBooster(user_id: string) {
    let guildMember: APIGuildMember

    try {
        guildMember = (await restApi.get(apiRoutes.guildMember(support_server_id, user_id))) as any
    } catch (err) {
        return false
    }

    return guildMember && guildMember.roles.includes(server_booster_role_id)
}
