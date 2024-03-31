import { BillDocument } from '@lacunahub/lacuna-database-driver'
import { APIGuildMember } from 'discord.js'
import { v4 as idv4 } from 'uuid'
import { addDiamond } from '..'
import database from '../../../../database'
import { supportServerId } from '../../../../internals/utility/Constants'
import DiscordUtils from '../../../utility/DiscordUtils'
import { OrderData } from './PayPal'

export class DiscordRolesCheckout {
    public billId: string
    public amount: OrderData['amount']
    public custom_fields: OrderData['custom_fields']
    public roleIds: string[]
    public billType: BillDocument['type']
    public maxActiveBills: number

    constructor(data: OrderData, billType: BillDocument['type'], roleIds: string[], maxActiveBills?: number) {
        this.billId = idv4()

        this.billType = billType

        this.amount = data.amount

        this.custom_fields = data.custom_fields

        this.roleIds = roleIds

        this.maxActiveBills = maxActiveBills ?? 1
    }

    async create() {
        const rolesMember = await isRolesMember(this.custom_fields.user_id, this.roleIds)

        if (rolesMember) {
            const activeBills = await database.bills.find({
                'custom_fields.user_id': this.custom_fields.user_id,
                type: this.billType,
                'status.value': { $ne: 'REJECTED' }
            })

            if (activeBills.length >= this.maxActiveBills) return 'MAX_ACTIVE_BILLS'

            const bill = await database.bills.create({
                _id: this.billId,
                type: this.billType,
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
                    tier: 0
                },
                comment: null,
                creation_timestamp: Date.now()
            } as any)

            await addDiamond(bill)

            return 'ROLES_MEMBER'
        }

        return 'NO_ROLES'
    }
}

export async function isRolesMember(userId: string, roleIds: string[]) {
    let guildMember: APIGuildMember

    try {
        guildMember = (await DiscordUtils.rest.get(DiscordUtils.restRoutes.guildMember(supportServerId, userId))) as any
    } catch (err) {
        return false
    }

    return guildMember && roleIds.every(i => guildMember.roles.includes(i))
}
