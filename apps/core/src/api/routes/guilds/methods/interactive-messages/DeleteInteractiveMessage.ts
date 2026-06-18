import APIError from '@/api/utility/APIError.js'
import DiscordUtils from '@/api/utility/DiscordUtils.js'
import database from '@/database/index.js'
import { type ServerDocument } from '@/database/schemas/Servers.js'
import { type Context } from 'koa'

export default async function deleteInteractiveMessage(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const imId: string = ctx.params.imId

    const interactiveMessage = server.modules.interactive_messages.find(v => v.id === imId)
    if (!interactiveMessage) ctx.throw(404, new APIError(1012))

    try {
        await DiscordUtils.rest.delete(
            DiscordUtils.restRoutes.channelMessage(interactiveMessage.channel_id, interactiveMessage.id)
        )
    } catch (err) {}

    await database.servers.updateOne(
        { _id: server._id },
        {
            $pull: {
                'modules.interactive_messages': {
                    id: interactiveMessage.id
                }
            }
        }
    )

    ctx.status = 204
}
