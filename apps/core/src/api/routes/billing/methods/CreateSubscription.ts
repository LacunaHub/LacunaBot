import database from '@/database'
import { SubscriptionMetadataProduct } from '@/database/schemas/Subscriptions'
import { APIGuild, APIUser } from 'discord.js'
import { Context } from 'koa'
import { projectTeamRoleId, serverBoosterRoleId, subscribedPatronRoleId, supportServerId } from '../../../../internals/utility/Constants'
import { SubscriptionData } from '../../../modules/billing'
import { DiscordRolesCheckout } from '../../../modules/billing/providers/DiscordRoles'
import APIError from '../../../utility/APIError'
import DiscordUtils from '../../../utility/DiscordUtils'

export default async function createSubscription(ctx: Context) {
    const currentUser: Partial<APIUser> = ctx.state.user
    const { subscription_method: subscriptionMethod, guild_id: guildId } = ctx.request.body

    const server = await database.servers.findOne({ _id: guildId })

    if (!server || server.blocked) ctx.throw(404, new APIError(1003))
    if (server.premium.available) ctx.throw(400, new APIError(2009))

    const { rootUsers } = await database.getInternalData()
    const data: SubscriptionData = {
        subscriberId: currentUser.id,
        productId: SubscriptionMetadataProduct.Diamond,
        refId: guildId
    }

    if (['Patreon', 'Boosty', 'DiscordNitroBoost', 'ProjectTeam'].includes(subscriptionMethod)) {
        if (subscriptionMethod === 'DiscordNitroBoost') {
            const env = await database.getEnv()
            let supportServer: APIGuild

            if (env.diamondForBoostsDisabled) ctx.throw(403, new APIError(4024))

            try {
                supportServer = (await DiscordUtils.rest.get(DiscordUtils.restRoutes.guild(supportServerId))) as any
            } catch (err) {
                ctx.throw(500, new APIError(5019))
            }

            if (supportServer.premium_subscription_count >= env.maxAllowedDiamondBoosts) {
                ctx.throw(400, new APIError(4022, `The support server has the maximum allowed number of boosts (${env.maxAllowedDiamondBoosts})`))
            }
        }

        let roleIds = [subscribedPatronRoleId],
            maxActiveSubscriptions = 1

        if (subscriptionMethod === 'DiscordNitroBoost') {
            roleIds = [serverBoosterRoleId]
        } else if (subscriptionMethod === 'ProjectTeam') {
            roleIds = [projectTeamRoleId]
            maxActiveSubscriptions = 2

            if (rootUsers.includes(currentUser.id)) {
                maxActiveSubscriptions = 100
            }
        }

        const discordRolesCheckout = new DiscordRolesCheckout(data, subscriptionMethod, roleIds, maxActiveSubscriptions)
        const rolesMember = await discordRolesCheckout.create()
        let code: number

        if (rolesMember === 'NoRoles') {
            code = 4019

            if (subscriptionMethod === 'DiscordNitroBoost') {
                code = 4020
            }
        } else if (rolesMember === 'MaxActiveSubscriptions') {
            code = 3015
        }

        if (typeof code === 'number') {
            ctx.throw(400, new APIError(code))
        }

        ctx.status = 204
    } else {
        ctx.throw(400, new APIError(1020))
    }
}
