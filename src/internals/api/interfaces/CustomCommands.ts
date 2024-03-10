import { ServerDocument, ServerModulesCustomCommand } from '@lacunahub/lacuna-database-driver'
import database from '../../../database'
import Logger from '../../Logger'
import DiscordUtils from '../../utility/DiscordUtils'
import APIError from '../utility/APIError'

export async function createCustomCommand(server: ServerDocument, data: ServerModulesCustomCommand) {
    const customCommands = server.modules.custom_commands

    if (customCommands.length >= 25 && !server.premium.available) throw new APIError(3001)
    if (customCommands.length >= 100) throw new APIError(3002)
    if (!data.components.length) throw new APIError(4003)

    const commandsCache = (await database.qdb.get('commands')) as any
    const commandNames = [...commandsCache.map(i => i.name), ...customCommands.map(i => i.command.name)]

    if (commandNames.some(i => data.command.name === i)) throw new APIError(4004)

    let apiCommand: any

    try {
        apiCommand = await DiscordUtils.restApi.post(DiscordUtils.apiRoutes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, server._id), {
            body: data.command
        })
    } catch (err) {
        await Logger.handleError({
            module: 'CustomCommands',
            action: 'Create',
            error: err,
            guild_id: server._id
        })

        throw new APIError(5002)
    }

    await database.servers.updateOne(
        { _id: server._id },
        {
            $push: {
                'modules.custom_commands': {
                    id: apiCommand.id,
                    ...data
                }
            }
        }
    )

    return {
        id: apiCommand.id,
        ...data
    }
}

export async function updateCustomCommand(server: ServerDocument, data: ServerModulesCustomCommand) {
    const customCommand = server.modules.custom_commands.find(i => i.id === data.id)

    if (!customCommand) throw new APIError(1011)

    if (JSON.stringify(data.command) !== JSON.stringify(customCommand.command)) {
        try {
            await DiscordUtils.restApi.patch(
                DiscordUtils.apiRoutes.applicationGuildCommand(process.env.DISCORD_CLIENT_ID, server._id, customCommand.id),
                {
                    body: data.command
                }
            )
        } catch (err) {
            await Logger.handleError({
                module: 'CustomCommands',
                action: 'Update',
                error: err,
                guild_id: server._id
            })

            throw new APIError(5003)
        }
    }

    await database.servers.updateOne(
        { _id: server._id, 'modules.custom_commands.id': customCommand.id },
        {
            $set: {
                'modules.custom_commands.$.command': data.command,
                'modules.custom_commands.$.components': data.components,
                'modules.custom_commands.$.options': data.options,
                'modules.custom_commands.$.throttling': data.throttling
            }
        }
    )

    return data
}

export async function deleteCustomCommand(server: ServerDocument, data: { id: string }) {
    const customCommand = server.modules.custom_commands.find(i => i.id === data.id)

    if (!customCommand) throw new APIError(1011)

    try {
        await DiscordUtils.restApi.delete(DiscordUtils.apiRoutes.applicationGuildCommand(process.env.DISCORD_CLIENT_ID, server._id, customCommand.id))
    } catch (err) {
        await Logger.handleError({
            module: 'CustomCommands',
            action: 'Delete',
            error: err,
            guild_id: server._id
        })

        throw new APIError(5004)
    }

    await database.servers.updateOne(
        { _id: server._id },
        {
            $pull: {
                'modules.custom_commands': {
                    id: customCommand.id
                }
            }
        }
    )

    return data
}
