import { type APIRole, REST, Routes } from 'discord.js'
import Logger from './Logger.js'

const rest = new REST({
    rejectOnRateLimit: rateLimitData => rateLimitData.timeToReset >= 1000 * 2.5
})

rest.setToken(process.env.LCN_DISCORD_CLIENT_TOKEN!)
rest.on('rateLimited', rateLimitInfo => Logger.warn({ rateLimitInfo }, 'rate limited'))

export function compareRolePositions(first: APIRole, second: APIRole) {
    return first.position === second.position ? first.id.localeCompare(second.id) : first.position - second.position
}

export default {
    rest,
    restRoutes: Routes,
    compareRolePositions
}
