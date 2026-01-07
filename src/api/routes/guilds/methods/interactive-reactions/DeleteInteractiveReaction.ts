import { ServerDocument } from '@/database/schemas/Servers'
import { Context } from 'koa'
import database from '../../../../../database'
import Logger from '../../../../../internals/Logger'
import APIError from '../../../../utility/APIError'
import DiscordUtils from '../../../../utility/DiscordUtils'

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
        await Logger.handleError({
            module: 'InteractiveReactions',
            action: 'DeleteReaction',
            error: err,
            guild_id: server._id
        })
    }

    ctx.status = 204
}
