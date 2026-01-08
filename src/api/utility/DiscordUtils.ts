import { RequestManager } from '@lacunahub/letsfrag'
import { APIRole, Routes } from 'discord.js'
import { redisStore } from '../../database'
import Logger from './Logger'

const rest = new RequestManager({
    rejectOnRateLimit: rateLimitData => rateLimitData.timeToReset >= 1000 * 2.5,
    store: redisStore
})

rest.setToken(process.env.LCN_DISCORD_CLIENT_TOKEN)
rest.on('rateLimited', rateLimitInfo => Logger.warn({ rateLimitInfo }, 'rate limited'))

export function compareRolePositions(first: APIRole, second: APIRole) {
    return first.position === second.position ? first.id.localeCompare(second.id) : first.position - second.position
}

export default {
    rest,
    restRoutes: Routes,
    compareRolePositions
}
