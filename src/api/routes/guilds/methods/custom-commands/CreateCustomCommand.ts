import { ServerDocument, ServerModulesCustomCommand } from '@lacunahub/lacuna-database-driver'
import { Context } from 'koa'
import database from '../../../../../database'
import Logger from '../../../../../internals/Logger'
import APIError from '../../../../utility/APIError'
import DiscordUtils from '../../../../utility/DiscordUtils'

export default async function createCustomCommand(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const data: ServerModulesCustomCommand = ctx.request.body

    if (server.modules.custom_commands.length >= 25 && !server.premium.available) ctx.throw(402, new APIError(3001))
    if (server.modules.custom_commands.length >= 100) ctx.throw(406, new APIError(3002))
    if (!data.components.length) ctx.throw(400, new APIError(4003))

    const commandsCache = (await database.qdb.get('commands')) as any
    const commandNames = [...commandsCache.map(v => v.name), ...server.modules.custom_commands.map(v => v.command.name)]

    if (commandNames.some(v => v === data.command.name)) ctx.throw(400, new APIError(4004))

    let apiCommand: any
    try {
        apiCommand = await DiscordUtils.rest.post(DiscordUtils.restRoutes.applicationGuildCommands(process.env.LCN_DISCORD_CLIENT_ID, server._id), {
            body: data.command
        })
    } catch (err) {
        await Logger.handleError({
            module: 'CustomCommands',
            action: 'Create',
            error: err,
            guild_id: server._id
        })

        ctx.throw(500, new APIError(5002))
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

    ctx.status = 200
    ctx.body = {
        id: apiCommand.id,
        ...data
    }
}
