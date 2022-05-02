import { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu } from 'discord.js'
import db from '../../../database'
import { InteractiveMessage, InteractiveMessageButtonComponent, InteractiveMessageSelectMenuComponent, ServerDocument } from '../../../database/schemas/Servers'
import { apiRoutes, restApi } from '../../utility/DiscordUtils'

export async function createInteractiveMessage(server: ServerDocument, data: InteractiveMessage) {
    const interactiveMessages = server.modules.interactive_messages

    if (interactiveMessages.length >= 5 && !server.server.premium.available) throw new Error('LIMIT_REACHED_NO_PREMIUM')
    if (interactiveMessages.length >= 50) throw new Error('LIMIT_REACHED')
    if (!data.message?.content && !data.message?.embed?.active) throw new Error('CANNOT_CREATE_EMPTY_MESSAGE')

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

    if (!data.components?.length && !reactions.length) throw new Error('NON_INTERACTIVE')

    const message = {
        content: data.message?.content ?? null,
        embeds: data.message.embed.active
            ? [
                  new MessageEmbed({
                      title: data.message.embed.title,
                      description: data.message.embed.description,
                      url: data.message.embed.url,
                      timestamp: data.message.embed.timestamp ? new Date(data.message.embed.timestamp) : null,
                      color: data.message.embed.color as any,
                      fields: data.message.embed.fields,
                      author: data.message.embed.author,
                      thumbnail: data.message.embed.thumbnail,
                      image: data.message.embed.image,
                      footer: data.message.embed.footer
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
        throw new Error('CANNOT_CREATE_MESSAGE')
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

export async function updateInteractiveMessage(server: ServerDocument, data: InteractiveMessage) {
    const interactiveMessages = server.modules.interactive_messages
    const im = interactiveMessages.find(i => i.id == data.id)

    if (!im) throw new Error('NOT_FOUND')

    let hasChanges = false
    const message = {
        content: im.message.content,
        embeds: im.message.embed.active
            ? [
                  new MessageEmbed({
                      title: im.message.embed.title,
                      description: im.message.embed.description,
                      url: im.message.embed.url,
                      timestamp: im.message.embed.timestamp ? new Date(im.message.embed.timestamp) : null,
                      color: im.message.embed.color as any,
                      fields: im.message.embed.fields,
                      author: im.message.embed.author,
                      thumbnail: im.message.embed.thumbnail,
                      image: im.message.embed.image,
                      footer: im.message.embed.footer
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
                  new MessageEmbed({
                      title: typeof data.message.embed.title === 'undefined' ? im.message.embed.title : data.message.embed.title,
                      description: typeof data.message.embed.description === 'undefined' ? im.message.embed.description : data.message.embed.description,
                      url: typeof data.message.embed.url ? im.message.embed.url : data.message.embed.url,
                      timestamp:
                          typeof data.message.embed.timestamp === 'undefined'
                              ? im.message.embed.timestamp
                                  ? new Date(im.message.embed.timestamp)
                                  : null
                              : new Date(data.message.embed.timestamp),
                      color: typeof data.message.embed.color === 'undefined' ? (im.message.embed.color as any) : (data.message.embed.color as any),
                      fields: data.message.embed.fields ?? im.message.embed.fields,
                      author: {
                          name: typeof data.message.embed.author?.name === 'undefined' ? im.message.embed.author.name : data.message.embed.author.name,
                          url: typeof data.message.embed.author?.url === 'undefined' ? im.message.embed.author.url : data.message.embed.author.url,
                          icon_url: typeof data.message.embed.author?.icon_url === 'undefined' ? im.message.embed.author.icon_url : data.message.embed.author.icon_url
                      },
                      thumbnail: typeof data.message.embed.thumbnail === 'undefined' ? im.message.embed.thumbnail : data.message.embed.thumbnail,
                      image: typeof data.message.embed.image === 'undefined' ? im.message.embed.image : data.message.embed.image,
                      footer: {
                          text: typeof data.message.embed.footer?.text === 'undefined' ? im.message.embed.footer.text : data.message.embed.footer.text,
                          icon_url: typeof data.message.embed.footer?.icon_url === 'undefined' ? im.message.embed.footer.icon_url : data.message.embed.footer.icon_url
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
            throw new Error('CANNOT_UPDATE_MESSAGE')
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
    const interactiveMessages = server.modules.interactive_messages
    const im = interactiveMessages.find(i => i.id == data.id)

    if (!im) throw new Error('NOT_FOUND')

    await restApi.delete(apiRoutes.channelMessage(im.channel_id, im.id)).catch(() => {})

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

function resolveMessageComponents(components: (InteractiveMessageButtonComponent | InteractiveMessageSelectMenuComponent)[][]) {
    return components.map(row => {
        return new MessageActionRow()
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
                        return i.type == 'BUTTON'
                            ? new MessageButton({
                                  customId: i.appearance.style == 'LINK' ? null : i.id,
                                  ...(i.appearance as any),
                                  url: i.appearance.style == 'LINK' ? i.appearance.url : null
                              })
                            : new MessageSelectMenu({
                                  customId: i.id,
                                  placeholder: i.placeholder,
                                  disabled: Boolean(i.disabled),
                                  options: i._options.map(ii => ii.appearance) as any
                              })
                    })
            )
            .toJSON()
    })
}
