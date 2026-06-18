import APIError from '@/api/utility/APIError.js'
import DiscordUtils from '@/api/utility/DiscordUtils.js'
import { validateCustomCommand } from '@/api/utility/validators/ValidateCustomCommand.js'
import database from '@/database/index.js'
import { type ServerDocument } from '@/database/schemas/Servers.js'
import { type Context } from 'koa'

export default async function updateCustomCommand(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const commandId: string = ctx.params.cid,
        data = validateCustomCommand(ctx.request.body)

    if (!data) ctx.throw(400, new APIError(4011))

    const command = server.modules.custom_commands.find(v => v.id === commandId)
    if (!command) ctx.throw(404, new APIError(1011))

    if (JSON.stringify(data.command) !== JSON.stringify(command.command)) {
        try {
            await DiscordUtils.rest.patch(
                DiscordUtils.restRoutes.applicationGuildCommand(
                    process.env.LCN_DISCORD_CLIENT_ID!,
                    server._id,
                    command.id
                ),
                {
                    body: data.command
                }
            )
        } catch (err) {
            ctx.log.error({
                module: 'CustomCommands',
                action: 'Update',
                err,
                guildId: server._id
            })

            ctx.throw(500, new APIError(5003))
        }
    }

    const updateData: Record<string, any> = {
        $set: {
            'modules.custom_commands.$.options': data.options,
            'modules.custom_commands.$.command': data.command
        },
        $unset: {}
    }

    if ('scripts' in data) {
        updateData.$set['modules.custom_commands.$.scripts'] = data.scripts
        updateData.$unset['modules.custom_commands.$.components'] = 1
    } else if ('components' in data) updateData.$set['modules.custom_commands.$.components'] = data.components

    if (data.throttling) updateData.$set['modules.custom_commands.$.throttling'] = data.throttling

    await database.servers.updateOne({ _id: server._id, 'modules.custom_commands.id': command.id }, updateData)

    ctx.status = 200
    ctx.body = data
}
