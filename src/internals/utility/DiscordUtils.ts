import { REST, Routes } from 'discord.js'
import Logger from '../Logger'

export const restApi = new REST({
    version: '10',
    rejectOnRateLimit: rateLimitData => rateLimitData.timeToReset >= 1000 * 2.5
}).setToken(process.env.LCN_DISCORD_CLIENT_TOKEN)
export const apiRoutes = Routes

restApi.on('rateLimited', rateLimitData => Logger.warn(`[DiscordRateLimited] ${JSON.stringify(rateLimitData)}`))

export function compareRolePositions(first: any, second: any) {
    return first.position === second.position ? second.id - first.id : first.position - second.position
}

export default {
    restApi,
    apiRoutes,
    compareRolePositions
}
