import database from '@/database/index.js'
import { SubscriptionMetadataProduct, SubscriptionStatus, SubscriptionType } from '@/database/schemas/Subscriptions.js'
import { type Snowflake, SnowflakeUtils } from '@/utility/SnowflakeUtils.js'
import { type APIGuildMember } from 'discord.js'
import { supportServerId } from '../../../../internals/utility/Constants.js'
import DiscordUtils from '../../../utility/DiscordUtils.js'
import { type SubscriptionData, addDiamond } from '../index.js'

export class DiscordRolesCheckout {
    public subscriptionId: Snowflake
    public subscriberId: string
    public productId: SubscriptionMetadataProduct
    public refId: string
    public type: SubscriptionType
    public roleIds: string[]
    public maxActiveSubscriptions: number

    constructor(
        data: SubscriptionData,
        subscriptionMethod: string,
        roleIds: string[],
        maxActiveSubscriptions?: number
    ) {
        this.subscriptionId = SnowflakeUtils.generate()

        this.subscriberId = data.subscriberId

        this.productId = data.productId

        this.refId = data.refId

        // @ts-ignore
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
