import { ServerDocument, ServerModulesInteractiveReaction } from '@lacunahub/lacuna-database-driver'
import { parseEmoji } from 'discord.js'
import { Context } from 'koa'
import database from '../../../../../database'
import Logger from '../../../../../internals/Logger'
import { generateSimpleId } from '../../../../../internals/utility/Utils'
import APIError from '../../../../utility/APIError'
import DiscordUtils from '../../../../utility/DiscordUtils'

export default async function createInteractiveReaction(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const data: Partial<ServerModulesInteractiveReaction> = ctx.request.body

    const elementId = data.id ?? `L${generateSimpleId(9)}`,
        emoji = parseEmoji(data.emoji as any)

    if (server.modules.reactions.length >= 50 && !server.premium.available) ctx.throw(402, new APIError(3005))
    if (server.modules.reactions.length >= 200) ctx.throw(406, new APIError(3006))
    if (server.modules.reactions.some(v => v.message.id === data.message.id && v.emoji.name === emoji.name)) ctx.throw(409, new APIError(4007))
    if (
        server.modules.reactions.some(
            v =>
                v.message.id === data.message.id &&
                (v.element.single || v.element.global_single) &&
                v.references.some(ref => data.references.includes(ref))
        )
    )
        ctx.throw(400, new APIError(4008))

    try {
        await DiscordUtils.rest.get(DiscordUtils.restRoutes.channelMessage(data.message.channel_id, data.message.id))
    } catch (err) {
        await Logger.handleError({
            module: 'InteractiveReactions',
            action: 'GetMessage',
            error: err,
            guild_id: server._id
        })

        ctx.throw(404, new APIError(1004))
    }

    try {
        await DiscordUtils.rest.put(
            DiscordUtils.restRoutes.channelMessageOwnReaction(
                data.message.channel_id,
                data.message.id,
                encodeURIComponent(emoji.id ? `${emoji.name}:${emoji.id}` : emoji.name)
            )
        )
    } catch (err) {
        await Logger.handleError({
            module: 'InteractiveReactions',
            action: 'CreateReaction',
            error: err,
            guild_id: server._id
        })

        ctx.throw(500, new APIError(5008))
    }

    const interactiveReaction = {
        id: elementId,
        type: data.type,
        element: {
            single: data.element.single,
            reverse: data.element.reverse
        },
        message: {
            id: data.message.id,
            channel_id: data.message.channel_id
        },
        emoji: emoji,
        references: data.references
    }

    await database.servers.updateOne(
        { _id: server._id },
        {
            $push: {
                'modules.reactions': interactiveReaction
            }
        }
    )

    ctx.status = 200
    ctx.body = interactiveReaction
}
