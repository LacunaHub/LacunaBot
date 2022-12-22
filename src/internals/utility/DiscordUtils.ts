import { REST, Routes } from 'discord.js'

export const restApi = new REST({ version: '10' }).setToken(process.env.CLIENT_TOKEN)
export const apiRoutes = Routes

export function compareRolePositions(first: any, second: any) {
    return first.position === second.position ? second.id - first.id : first.position - second.position
}

export default {
    restApi,
    apiRoutes,
    compareRolePositions
}
