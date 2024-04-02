import { RequestManager, RequestManagerOptions } from '@lacunahub/letsfrag'
import { APIRole, Routes } from 'discord.js'
import Logger from '../../internals/Logger'

const rest = new RequestManager({
    rejectOnRateLimit: rateLimitData => rateLimitData.timeToReset >= 1000 * 2.5,
    makeRequest: fetch as unknown as RequestManagerOptions['makeRequest'],
    store: {
        uri: process.env.LCN_REDIS_URI,
        hashesNamespace: 'rqm.hashes',
        handlersNamespace: 'rqm.handlers'
    }
})

rest.setToken(process.env.LCN_DISCORD_CLIENT_TOKEN)
rest.on('rateLimited', rateLimitData => Logger.warn(`[DiscordRateLimited] ${JSON.stringify(rateLimitData)}`))

export function compareRolePositions(first: APIRole, second: APIRole) {
    return first.position === second.position ? first.id.localeCompare(second.id) : first.position - second.position
}

export default {
    rest,
    restRoutes: Routes,
    compareRolePositions
}
