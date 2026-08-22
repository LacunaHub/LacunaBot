import APIError from '@/api/utility/APIError.js'
import DiscordUtils from '@/api/utility/DiscordUtils.js'
import { validateCustomCommand } from '@/api/utility/validators/ValidateCustomCommand.js'
import database from '@/database/index.js'
import { type ServerDocument } from '@/database/schemas/Servers.js'
import { type Context } from 'koa'

export default async function createCustomCommand(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const data = validateCustomCommand(ctx.request.body)

    if (!data) ctx.throw(400, new APIError(4011))
    if (server.modules.custom_commands.length >= 100) ctx.throw(406, new APIError(3002))

    const commandsCache = (await database.qdb.get('commands')) as any[],
        commandNames = [...commandsCache.map(v => v.name), ...server.modules.custom_commands.map(v => v.command.name)]
    if (commandNames.some(v => v === data.command.name)) ctx.throw(400, new APIError(4004))

    let apiCommand: any
    try {
        apiCommand = await DiscordUtils.rest.post(
            DiscordUtils.restRoutes.applicationGuildCommands(process.env.LCN_DISCORD_CLIENT_ID!, server._id),
            {
                body: data.command
            }
        )
    } catch (err) {
        ctx.log.error({
            module: 'CustomCommands',
            action: 'Create',
            err,
            guildId: server._id
        })

        ctx.throw(500, new APIError(5002))
    }

    data.id = apiCommand.id

    await database.servers.updateOne(
        { _id: server._id },
        {
            $push: {
                'modules.custom_commands': data
            }
        }
    )

    ctx.status = 200
    ctx.body = data
}
