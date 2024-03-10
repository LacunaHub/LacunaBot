import {
    ServerDocument,
    ServerModulesInteractiveMessage,
    ServerModulesInteractiveMessageButtonComponent,
    ServerModulesInteractiveMessageSelectMenuComponent
} from '@lacunahub/lacuna-database-driver'
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    resolveColor,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} from 'discord.js'
import db from '../../../database'
import Logger from '../../Logger'
import { apiRoutes, restApi } from '../../utility/DiscordUtils'
import { snakeToPascalCase } from '../../utility/Utils'
import APIError from '../utility/APIError'

export async function createInteractiveMessage(server: ServerDocument, data: ServerModulesInteractiveMessage) {
    const interactiveMessages = server.modules.interactive_messages

    if (interactiveMessages.length >= 5 && !server.premium.available) throw new APIError(3003)
    if (interactiveMessages.length >= 50) throw new APIError(3004)
    if (!data.message?.content && !data.message?.embed?.active) throw new APIError(4005)

    // prettier-ignore
    const reactions = data.reactions
        ?.filter(i => {
            return Boolean(
                typeof i.id === 'string' && i.id &&
                typeof i.emoji.name === 'string' &&
                typeof i.emoji.animated === 'boolean' &&
                Array.isArray(i.options) && i.options.length && i.options.every(ii => typeof ii === 'string')
            )
        })
        ?.slice(0, 10) ?? []

    if (!data.components?.length && !reactions.length) throw new APIError(4006)

    const message = {
        content: data.message?.content ?? null,
        embeds: data.message.embed.active
            ? [
                  new EmbedBuilder({
                      title: data.message.embed.title,
                      description: data.message.embed.description,
                      url: data.message.embed.url,
                      timestamp: data.message.embed.timestamp ? new Date(data.message.embed.timestamp) : null,
                      color: data.message.embed.color ? resolveColor(data.message.embed.color as any) : null,
                      fields: data.message.embed.fields,
                      author: data.message.embed.author as any,
                      thumbnail: data.message.embed.thumbnail as any,
                      image: data.message.embed.image as any,
                      footer: data.message.embed.footer as any
                  }).toJSON()
              ]
            : [],
        components: []
    }

    message.components = resolveMessageComponents(data.components)

    let apiMessage: any

    try {
        apiMessage = await restApi.post(apiRoutes.channelMessages(data.channel_id), { body: message })
    } catch (err) {
        await Logger.handleError({
            module: 'InteractiveMessages',
            action: 'SendMessage',
            error: err,
            guild_id: server._id
        })

        throw new APIError(5005)
    }

    if (reactions.length) {
        for (const reaction of reactions) {
            try {
                await restApi.put(
                    apiRoutes.channelMessageOwnReaction(
                        apiMessage.channel_id,
                        apiMessage.id,
                        encodeURIComponent(reaction.emoji.id ? `${reaction.emoji.name}:${reaction.emoji.id}` : reaction.emoji.name)
                    )
                )
            } catch (err) {
                break
            }
        }
    }

    await db.servers.updateOne(
        { _id: server._id },
        {
            $push: {
                'modules.interactive_messages': {
                    id: apiMessage.id,
                    ...data,
                    reactions
                }
            }
        }
    )

    return {
        id: apiMessage.id,
        ...data,
        reactions
    }
}

export async function updateInteractiveMessage(server: ServerDocument, data: ServerModulesInteractiveMessage) {
    const im = server.modules.interactive_messages.find(i => i.id === data.id)

    if (!im) throw new APIError(1012)

    let hasChanges = false
    const message = {
        content: im.message.content,
        embeds: im.message.embed.active
            ? [
                  new EmbedBuilder({
                      title: im.message.embed.title,
                      description: im.message.embed.description,
                      url: im.message.embed.url,
                      timestamp: im.message.embed.timestamp ? new Date(im.message.embed.timestamp) : null,
                      color: im.message.embed.color ? resolveColor(im.message.embed.color as any) : null,
                      fields: im.message.embed.fields,
                      author: im.message.embed.author as any,
                      thumbnail: im.message.embed.thumbnail as any,
                      image: im.message.embed.image as any,
                      footer: im.message.embed.footer as any
                  }).toJSON()
              ]
            : [],
        components: resolveMessageComponents(im.components)
    }

    if (JSON.stringify(data.message) !== JSON.stringify(im.message)) {
        hasChanges = true
        message.content = data.message?.content ?? im.message.content
        message.embeds = data.message?.embed?.active
            ? [
                  new EmbedBuilder({
                      title: data.message.embed.title ? data.message.embed.title : im.message.embed.title,
                      description: data.message.embed.description ? data.message.embed.description : im.message.embed.description,
                      url: data.message.embed.url ? data.message.embed.url : im.message.embed.url,
                      timestamp: data.message.embed.timestamp
                          ? new Date(data.message.embed.timestamp)
                          : im.message.embed.timestamp
                          ? new Date(im.message.embed.timestamp)
                          : null,
                      color: data.message.embed.color
                          ? data.message.embed.color
                              ? resolveColor(data.message.embed.color as any)
                              : null
                          : im.message.embed.color
                          ? resolveColor(im.message.embed.color as any)
                          : null,
                      fields: data.message.embed.fields ?? im.message.embed.fields,
                      author: {
                          name: data.message.embed.author?.name ? data.message.embed.author.name : im.message.embed.author.name,
                          url: data.message.embed.author?.url ? data.message.embed.author.url : im.message.embed.author.url,
                          icon_url: data.message.embed.author?.icon_url ? data.message.embed.author.icon_url : im.message.embed.author.icon_url
                      },
                      thumbnail: (data.message.embed.thumbnail ? data.message.embed.thumbnail : im.message.embed.thumbnail) as any,
                      image: (data.message.embed.image ? data.message.embed.image : im.message.embed.image) as any,
                      footer: {
                          text: data.message.embed.footer?.text ? data.message.embed.footer.text : im.message.embed.footer.text,
                          icon_url: data.message.embed.footer?.icon_url ? data.message.embed.footer.icon_url : im.message.embed.footer.icon_url
                      }
                  }).toJSON()
              ]
            : []
    }

    if (JSON.stringify(data.components) !== JSON.stringify(im.components)) {
        hasChanges = true
        message.components = resolveMessageComponents(data.components)
    }

    if (hasChanges) {
        try {
            await restApi.patch(apiRoutes.channelMessage(im.channel_id, im.id), { body: message })

            await db.servers.updateOne(
                { _id: server._id, 'modules.interactive_messages.id': im.id },
                {
                    $set: {
                        'modules.interactive_messages.$.message': data.message,
                        'modules.interactive_messages.$.components': data.components
                    }
                }
            )
        } catch (err) {
            await Logger.handleError({
                module: 'InteractiveMessages',
                action: 'UpdateMessage',
                error: err,
                guild_id: server._id
            })

            throw new APIError(5006)
        }
    }

    if (JSON.stringify(data.reactions) !== JSON.stringify(im.reactions)) {
        const added = data.reactions.filter(i => !im.reactions.some(ii => i.id == ii.id))
        const removed = im.reactions.filter(i => !data.reactions.some(ii => i.id == ii.id))

        for (const reaction of added) {
            try {
                await restApi.put(
                    apiRoutes.channelMessageOwnReaction(
                        im.channel_id,
                        im.id,
                        encodeURIComponent(reaction.emoji.id ? `${reaction.emoji.name}:${reaction.emoji.id}` : reaction.emoji.name)
                    )
                )
            } catch (err) {
                break
            }
        }

        for (const reaction of removed) {
            try {
                await restApi.delete(
                    apiRoutes.channelMessageOwnReaction(
                        im.channel_id,
                        im.id,
                        encodeURIComponent(reaction.emoji.id ? `${reaction.emoji.name}:${reaction.emoji.id}` : reaction.emoji.name)
                    )
                )
            } catch (err) {
                break
            }
        }

        await db.servers.updateOne(
            { _id: server._id, 'modules.interactive_messages.id': im.id },
            {
                $set: {
                    'modules.interactive_messages.$.reactions': data.reactions
                }
            }
        )
    }

    return data
}

export async function deleteInteractiveMessage(server: ServerDocument, data: { id: string }) {
    const im = server.modules.interactive_messages.find(i => i.id === data.id)

    if (!im) throw new APIError(1012)

    try {
        await restApi.delete(apiRoutes.channelMessage(im.channel_id, im.id))
    } catch (err) {}

    await db.servers.updateOne(
        { _id: server._id },
        {
            $pull: {
                'modules.interactive_messages': {
                    id: im.id
                }
            }
        }
    )

    return data
}

function resolveMessageComponents(
    components: (ServerModulesInteractiveMessageButtonComponent | ServerModulesInteractiveMessageSelectMenuComponent)[][]
) {
    return components.map(row => {
        return new ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>()
            .addComponents(
                row
                    .filter(i => {
                        if (i.type == 'BUTTON')
                            return Boolean(
                                typeof i.id === 'string' &&
                                    i.id &&
                                    (i.appearance.label || i.appearance.emoji?.name) &&
                                    ((Array.isArray(i.options) && i.options.length && i.options.every(ii => typeof ii === 'string')) ||
                                        (i.appearance.style == 'LINK' && i.appearance.url))
                            )

                        if (i.type == 'SELECT_MENU')
                            return Boolean(
                                typeof i.id === 'string' &&
                                    i.id &&
                                    Array.isArray(i._options) &&
                                    i._options.length &&
                                    i._options.every(ii => ii.appearance.label && ii.appearance.value)
                            )
                    })
                    .map(i => {
                        if (i.type === 'BUTTON') {
                            const button = new ButtonBuilder().setStyle(ButtonStyle[snakeToPascalCase(i.appearance.style)])

                            if (i.appearance.style !== 'LINK') button.setCustomId(i.id)
                            else button.setURL(i.appearance.url)
                            button.setLabel(i.appearance.label)
                            if (i.appearance.emoji.name) button.setEmoji(i.appearance.emoji.id ? i.appearance.emoji : i.appearance.emoji.name)

                            return button
                        }

                        if (i.type === 'SELECT_MENU') {
                            const selectMenu = new StringSelectMenuBuilder().setCustomId(i.id)

                            selectMenu.setPlaceholder(i.placeholder)
                            selectMenu.setOptions(
                                i._options.map(ii => {
                                    const option = new StringSelectMenuOptionBuilder().setLabel(ii.appearance.label).setValue(ii.appearance.value)

                                    if (ii.appearance.description) option.setDescription(ii.appearance.description)
                                    if (ii.appearance.emoji.name)
                                        option.setEmoji((ii.appearance.emoji.id ? ii.appearance.emoji : ii.appearance.emoji.name) as any)

                                    return option
                                })
                            )

                            return selectMenu
                        }
                    })
            )
            .toJSON()
    })
}
