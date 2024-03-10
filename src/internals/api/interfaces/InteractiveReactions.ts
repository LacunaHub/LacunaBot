import { ServerDocument, ServerModulesInteractiveReaction } from '@lacunahub/lacuna-database-driver'
import { parseEmoji } from 'discord.js'
import database from '../../../database'
import { generateId } from '../../../modules/Reactions'
import Logger from '../../Logger'
import DiscordUtils from '../../utility/DiscordUtils'
import APIError from '../utility/APIError'

export async function createInteractiveReaction(server: ServerDocument, data: Partial<ServerModulesInteractiveReaction>) {
    const element_id = data.id ?? generateId(),
        emoji = parseEmoji(data.emoji as any),
        interactiveReactions = server.modules.reactions

    if (interactiveReactions.length >= 50 && !server.premium.available) throw new APIError(3005)
    if (interactiveReactions.length >= 200) throw new APIError(3006)
    if (interactiveReactions.some(r => r.message.id === data.message.id && r.emoji.name === emoji.name)) throw new APIError(4007)
    if (
        interactiveReactions.some(
            r =>
                r.message.id === data.message.id &&
                (r.element.single || r.element.global_single) &&
                r.references.some(ref => data.references.includes(ref))
        )
    )
        throw new APIError(4008)

    try {
        await DiscordUtils.restApi.get(DiscordUtils.apiRoutes.channelMessage(data.message.channel_id, data.message.id))
    } catch (err) {
        await Logger.handleError({
            module: 'InteractiveReactions',
            action: 'GetMessage',
            error: err,
            guild_id: server._id
        })

        throw new APIError(1004)
    }

    try {
        await DiscordUtils.restApi.put(
            DiscordUtils.apiRoutes.channelMessageOwnReaction(
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

        throw new APIError(5008)
    }

    const reaction = {
        id: element_id,
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
                'modules.reactions': reaction
            }
        }
    )

    return reaction
}

export async function updateInteractiveReaction(server: ServerDocument, data: ServerModulesInteractiveReaction) {
    const interactiveReaction = server.modules.reactions.find(r => r.id === data.id)

    if (!interactiveReaction) throw new APIError(1013)

    if (
        server.modules.reactions.some(
            r =>
                r.id !== data.id &&
                r.message.id === data.message.id &&
                (r.element.single || r.element.global_single) &&
                r.references.some(ref => data.references.includes(ref))
        )
    )
        throw new APIError(4008)

    await database.servers.updateOne(
        { _id: server._id, 'modules.reactions.id': interactiveReaction.id },
        {
            $set: {
                'modules.reactions.$.element.single': data.element.single,
                'modules.reactions.$.element.reverse': data.element.reverse,
                'modules.reactions.$.references': data.references
            }
        }
    )

    return data
}

export async function deleteInteractiveReaction(server: ServerDocument, data: { id: string }) {
    const interactiveReaction = server.modules.reactions.find(r => r.id === data.id)

    if (!interactiveReaction) throw new APIError(1013)

    await database.servers.updateOne(
        { _id: server._id },
        {
            $pull: {
                'modules.reactions': {
                    id: data.id
                }
            }
        }
    )

    try {
        await DiscordUtils.restApi.delete(
            DiscordUtils.apiRoutes.channelMessageReaction(
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

    return data
}
