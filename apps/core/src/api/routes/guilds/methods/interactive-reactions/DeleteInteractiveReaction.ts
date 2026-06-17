import APIError from '@/api/utility/APIError.js'
import DiscordUtils from '@/api/utility/DiscordUtils.js'
import database from '@/database/index.js'
import { type ServerDocument } from '@/database/schemas/Servers.js'
import { type Context } from 'koa'

export default async function deleteInteractiveReaction(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const irId: string = ctx.params.irId

    const interactiveReaction = server.modules.reactions.find(v => v.id === irId)
    if (!interactiveReaction) ctx.throw(404, new APIError(1013))

    await database.servers.updateOne(
        { _id: server._id },
        {
            $pull: {
                'modules.reactions': {
                    id: interactiveReaction.id
                }
            }
        }
    )

    try {
        await DiscordUtils.rest.delete(
            DiscordUtils.restRoutes.channelMessageReaction(
                interactiveReaction.message.channel_id,
                interactiveReaction.message.id,
                encodeURIComponent(
                    interactiveReaction.emoji.id
                        ? `${interactiveReaction.emoji.name}:${interactiveReaction.emoji.id}`
                        : interactiveReaction.emoji.name
                )
            )
        )
    } catch (err) {
        ctx.log.error({
            module: 'InteractiveReactions',
            action: 'DeleteReaction',
            err,
            guildId: server._id
        })
    }

    ctx.status = 204
}
