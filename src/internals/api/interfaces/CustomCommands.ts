import qdb from 'quick.db'
import database from '../../../database'
import { ICustomCommand, ServerDocument } from '../../../database/schemas/Servers'
import DiscordUtils from '../../utility/DiscordUtils'

export async function createCustomCommand(server: ServerDocument, data: ICustomCommand) {
    const customCommands = server.modules.custom_commands

    // if (customCommands.length >= 5 && !server.server.premium.available) throw new Error('LIMIT_REACHED_NO_PREMIUM')
    if (customCommands.length >= 25) throw new Error('LIMIT_REACHED')
    if (!data.components.length) throw new Error('NO_COMPONENTS')

    const commandNames = [...qdb.get('commands').map(i => i.name), ...customCommands.map(i => i.command.name)]

    if (commandNames.some(i => data.command.name === i)) throw new Error('NAME_CONFLICT')

    let apiCommand: any

    try {
        apiCommand = await DiscordUtils.restApi.post(DiscordUtils.apiRoutes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, server._id), {
            body: data.command
        })
    } catch (err) {
        throw new Error('CANNOT_CREATE_COMMAND')
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

export async function updateCustomCommand(server: ServerDocument, data: ICustomCommand) {
    const customCommands = server.modules.custom_commands
    const cc = customCommands.find(i => i.id === data.id)

    if (!cc) throw new Error('NOT_FOUND')

    if (JSON.stringify(data.command) !== JSON.stringify(cc.command)) {
        try {
            await DiscordUtils.restApi.patch(DiscordUtils.apiRoutes.applicationGuildCommand(process.env.DISCORD_CLIENT_ID, server._id, cc.id), {
                body: data.command
            })
        } catch (err) {
            throw new Error('CANNOT_UPDATE_COMMAND')
        }
    }

    await database.servers.updateOne(
        { _id: server._id, 'modules.custom_commands.id': cc.id },
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
    const customCommands = server.modules.custom_commands
    const cc = customCommands.find(i => i.id === data.id)

    if (!cc) throw new Error('NOT_FOUND')

    try {
        await DiscordUtils.restApi.delete(DiscordUtils.apiRoutes.applicationGuildCommand(process.env.DISCORD_CLIENT_ID, server._id, cc.id))
    } catch (err) {
        throw new Error('CANNOT_DELETE_COMMAND')
    }

    await database.servers.updateOne(
        { _id: server._id },
        {
            $pull: {
                'modules.custom_commands': {
                    id: cc.id
                }
            }
        }
    )

    return data
}
