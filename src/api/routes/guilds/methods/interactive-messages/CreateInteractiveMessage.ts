import {
    ServerDocument,
    ServerModulesInteractiveMessage,
    ServerModulesInteractiveMessageButtonComponent,
    ServerModulesInteractiveMessageSelectMenuComponent
} from '@/database/schemas/Servers'
import {
    ActionRowBuilder,
    APIMessage,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    resolveColor,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} from 'discord.js'
import { Context } from 'koa'
import database from '../../../../../database'
import Logger from '../../../../../internals/Logger'
import { snakeToPascalCase } from '../../../../../internals/utility/Utils'
import APIError from '../../../../utility/APIError'
import DiscordUtils from '../../../../utility/DiscordUtils'

export default async function createInteractiveMessage(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const data: ServerModulesInteractiveMessage = ctx.request.body

    if (server.modules.interactive_messages.length >= 5 && !server.premium.available) ctx.throw(402, new APIError(3003))
    if (server.modules.interactive_messages.length >= 50) ctx.throw(406, new APIError(3004))
    if (!data.message?.content && !data.message?.embed?.active) ctx.throw(400, new APIError(4005))

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

    if (!data.components?.length && !reactions.length) ctx.throw(400, new APIError(4006))

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
        components: resolveMessageComponents(data.components)
    }

    let apiMessage: APIMessage
    try {
        apiMessage = (await DiscordUtils.rest.post(DiscordUtils.restRoutes.channelMessages(data.channel_id), {
            body: message
        })) as any
    } catch (err) {
        await Logger.handleError({
            module: 'InteractiveMessages',
            action: 'SendMessage',
            error: err,
            guild_id: server._id
        })

        ctx.throw(500, new APIError(5005))
    }

    if (reactions.length) {
        for (const reaction of reactions) {
            try {
                await DiscordUtils.rest.put(
                    DiscordUtils.restRoutes.channelMessageOwnReaction(
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

    await database.servers.updateOne(
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

    ctx.status = 200
    ctx.body = {
        id: apiMessage.id,
        ...data,
        reactions
    }
}

export function resolveMessageComponents(
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
