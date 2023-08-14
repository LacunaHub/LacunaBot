import { parseEmoji } from 'discord.js'
import database from '../../../database'
import { InteractiveReaction, ServerDocument } from '../../../database/schemas/Servers'
import { generateId } from '../../../modules/Reactions'
import DiscordUtils from '../../utility/DiscordUtils'

export async function createInteractiveReaction(server: ServerDocument, data: Partial<InteractiveReaction>) {
    const element_id = data.id ?? generateId(),
        emoji = parseEmoji(data.emoji as any),
        interactiveReactions = server.modules.reactions

    if (interactiveReactions.length >= 50 && !server.server.premium.available) throw new Error('LIMIT_REACHED_NO_PREMIUM')
    if (interactiveReactions.length >= 200) throw new Error('LIMIT_REACHED')
    if (interactiveReactions.some(r => r.message.id === data.message.id && r.emoji.name === emoji.name)) throw new Error('EMOJI_ALREADY_USED')
    if (
        interactiveReactions.some(
            r =>
                r.message.id == data.message.id &&
                (r.element.single || r.element.global_single) &&
                r.references.some(ref => data.references.includes(ref))
        )
    )
        throw new Error('REFERENCE_IS_SINGLE')

    let message: any
    let puttedReaction: any

    try {
        message = await DiscordUtils.restApi.get(DiscordUtils.apiRoutes.channelMessage(data.message.channel_id, data.message.id))
    } catch (err) {}

    if (!message) throw new Error('UNKNOWN_MESSAGE')

    try {
        puttedReaction = await DiscordUtils.restApi.put(
            DiscordUtils.apiRoutes.channelMessageOwnReaction(
                data.message.channel_id,
                data.message.id,
                encodeURIComponent(emoji.id ? `${emoji.name}:${emoji.id}` : emoji.name)
            )
        )
    } catch (err) {}

    if (!puttedReaction) throw new Error('CANNOT_CREATE_REACTION')

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

export async function updateInteractiveReaction(server: ServerDocument, data: InteractiveReaction) {
    const interactiveReaction = server.modules.reactions.find(r => r.id === data.id)
    if (!interactiveReaction) throw new Error('NOT_FOUND')

    if (
        server.modules.reactions.some(
            r =>
                r.id != data.id &&
                r.message.id == data.message.id &&
                (r.element.single || r.element.global_single) &&
                r.references.some(ref => data.references.includes(ref))
        )
    )
        return 'reference_is_single'

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
    if (!interactiveReaction) throw new Error('NOT_FOUND')

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
    } catch (err) {}

    return data
}
