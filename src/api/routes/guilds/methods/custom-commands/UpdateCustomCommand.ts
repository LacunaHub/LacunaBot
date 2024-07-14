import { ServerDocument, ServerModulesCustomCommand } from '@lacunahub/lacuna-database-driver'
import { Context } from 'koa'
import database from '../../../../../database'
import Logger from '../../../../../internals/Logger'
import APIError from '../../../../utility/APIError'
import DiscordUtils from '../../../../utility/DiscordUtils'

export default async function updateCustomCommand(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const commandId: string = ctx.params.cid,
        data: ServerModulesCustomCommand = ctx.request.body

    const command = server.modules.custom_commands.find(v => v.id === commandId)
    if (!command) ctx.throw(404, new APIError(1011))

    if (JSON.stringify(data.command) !== JSON.stringify(command.command)) {
        try {
            await DiscordUtils.rest.patch(
                DiscordUtils.restRoutes.applicationGuildCommand(process.env.LCN_DISCORD_CLIENT_ID, server._id, command.id),
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

            ctx.throw(500, new APIError(5003))
        }
    }

    await database.servers.updateOne(
        { _id: server._id, 'modules.custom_commands.id': command.id },
        {
            $set: {
                'modules.custom_commands.$.command': data.command,
                'modules.custom_commands.$.components': data.components,
                'modules.custom_commands.$.options': data.options,
                'modules.custom_commands.$.throttling': data.throttling
            }
        }
    )

    ctx.status = 200
    ctx.body = data
}
