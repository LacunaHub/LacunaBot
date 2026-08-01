import APIError from '@/api/utility/APIError.js'
import DiscordUtils from '@/api/utility/DiscordUtils.js'
import database from '@/database/index.js'
import { type ServerDocument, type ServerModulesInteractiveReaction } from '@/database/schemas/Servers.js'
import { generateSimpleId } from '@/internals/utility/Utils.js'
import { parseEmoji, type APIGuildChannel } from 'discord.js'
import { type Context } from 'koa'

export default async function createInteractiveReaction(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const data: Partial<ServerModulesInteractiveReaction> = ctx.request.body

    const elementId = data.id ?? `L${generateSimpleId(9)}`,
        emoji = parseEmoji(data.emoji as any)!

    if (server.modules.reactions.length >= 50 && !server.premium.available) ctx.throw(402, new APIError(3005))
    if (server.modules.reactions.length >= 200) ctx.throw(406, new APIError(3006))
    if (server.modules.reactions.some(v => v.message.id === data.message!.id && v.emoji.name === emoji.name))
        ctx.throw(409, new APIError(4007))
    if (
        server.modules.reactions.some(
            v =>
                v.message.id === data.message!.id &&
                (v.element.single || v.element.global_single) &&
                v.references.some(ref => data.references!.includes(ref))
        )
    )
        ctx.throw(400, new APIError(4008))

    const apiChannel = (await DiscordUtils.rest.get(
        DiscordUtils.restRoutes.channel(data.message!.channel_id)
    )) as APIGuildChannel
    if (apiChannel.guild_id !== server._id) ctx.throw(400, new APIError(5008))

    try {
        await DiscordUtils.rest.get(DiscordUtils.restRoutes.channelMessage(data.message!.channel_id, data.message!.id))
    } catch (err) {
        ctx.log.error({
            module: 'InteractiveReactions',
            action: 'GetMessage',
            err,
            guildId: server._id
        })

        ctx.throw(404, new APIError(1004))
    }

    try {
        await DiscordUtils.rest.put(
            DiscordUtils.restRoutes.channelMessageOwnReaction(
                data.message!.channel_id,
                data.message!.id,
                encodeURIComponent(emoji?.id ? `${emoji.name}:${emoji.id}` : emoji.name)
            )
        )
    } catch (err) {
        ctx.log.error({
            module: 'InteractiveReactions',
            action: 'CreateReaction',
            err,
            guildId: server._id
        })

        ctx.throw(500, new APIError(5008))
    }

    const interactiveReaction = {
        id: elementId,
        type: data.type,
        element: {
            single: data.element!.single,
            reverse: data.element!.reverse
        },
        message: {
            id: data.message!.id,
            channel_id: data.message!.channel_id
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
