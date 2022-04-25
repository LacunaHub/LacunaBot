import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'

export const restApi = new REST({ version: '9' }).setToken(process.env.CLIENT_TOKEN)
export const apiRoutes = Routes

export default {
    restApi,
    apiRoutes
}