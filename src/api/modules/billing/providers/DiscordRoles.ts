import { SubscriptionMetadataProduct, SubscriptionStatus, SubscriptionType } from '@lacunahub/lacuna-database-driver'
import { APIGuildMember } from 'discord.js'
import { SubscriptionData, addDiamond } from '..'
import database from '../../../../database'
import { supportServerId } from '../../../../internals/utility/Constants'
import DiscordUtils from '../../../utility/DiscordUtils'
import { generateSnowflake } from '../../../utility/Snowflake'

export class DiscordRolesCheckout {
    public subscriptionId: string
    public subscriberId: string
    public productId: SubscriptionMetadataProduct
    public refId: string
    public type: SubscriptionType
    public roleIds: string[]
    public maxActiveSubscriptions: number

    constructor(data: SubscriptionData, subscriptionMethod: string, roleIds: string[], maxActiveSubscriptions?: number) {
        this.subscriptionId = generateSnowflake()

        this.subscriberId = data.subscriberId

        this.productId = data.productId

        this.refId = data.refId

        this.type = SubscriptionType[subscriptionMethod]

        this.roleIds = roleIds

        this.maxActiveSubscriptions = maxActiveSubscriptions ?? 1
    }

    async create() {
        const rolesMember = await isRolesMember(this.subscriberId, this.roleIds)

        if (rolesMember) {
            const activeSubscriptions = await database.subscriptions.find({
                subscriber_id: this.subscriberId,
                type: [SubscriptionType.Patreon, SubscriptionType.Boosty].includes(this.type)
                    ? { $in: [SubscriptionType.Patreon, SubscriptionType.Boosty] }
                    : this.type,
                status: { $ne: SubscriptionStatus.Cancelled }
            })

            if (activeSubscriptions.length >= this.maxActiveSubscriptions) return 'MaxActiveSubscriptions'

            const subscription = await database.subscriptions.create({
                _id: this.subscriptionId,
                type: this.type,
                status: SubscriptionStatus.Active,
                subscriber_id: this.subscriberId,
                metadata: {
                    provider_external_id: null,
                    product_id: this.productId,
                    ref_id: this.refId
                }
            })

            await addDiamond(subscription)

            return 'RolesMember'
        }

        return 'NoRoles'
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
