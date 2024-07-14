import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { Context } from 'koa'
import database from '../../../../../database'
import Logger from '../../../../../internals/Logger'
import APIError from '../../../../utility/APIError'
import DiscordUtils from '../../../../utility/DiscordUtils'

export default async function deleteCustomCommand(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const commandId: string = ctx.params.cid

    const command = server.modules.custom_commands.find(v => v.id === commandId)
    if (!command) ctx.throw(404, new APIError(1011))

    try {
        await DiscordUtils.rest.delete(DiscordUtils.restRoutes.applicationGuildCommand(process.env.LCN_DISCORD_CLIENT_ID, server._id, command.id))
    } catch (err) {
        await Logger.handleError({
            module: 'CustomCommands',
            action: 'Delete',
            error: err,
            guild_id: server._id
        })

        ctx.throw(500, new APIError(5004))
    }

    await database.servers.updateOne(
        { _id: server._id },
        {
            $pull: {
                'modules.custom_commands': {
                    id: command.id
                }
            }
        }
    )

    ctx.status = 204
}
