import { ServerDocument, ServerModulesInteractiveMessage } from '@/database/schemas/Servers'
import { EmbedBuilder, resolveColor } from 'discord.js'
import { Context } from 'koa'
import database from '../../../../../database'
import APIError from '../../../../utility/APIError'
import DiscordUtils from '../../../../utility/DiscordUtils'
import { resolveMessageComponents } from './CreateInteractiveMessage'

export default async function updateInteractiveMessage(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const imId: string = ctx.params.imId,
        data: ServerModulesInteractiveMessage = ctx.request.body

    const interactiveMessage = server.modules.interactive_messages.find(v => v.id === imId)
    if (!interactiveMessage) ctx.throw(404, new APIError(1012))

    let hasChanges = false
    const message = {
        content: interactiveMessage.message.content,
        embeds: interactiveMessage.message.embed.active
            ? [
                  new EmbedBuilder({
                      title: interactiveMessage.message.embed.title,
                      description: interactiveMessage.message.embed.description,
                      url: interactiveMessage.message.embed.url,
                      timestamp: interactiveMessage.message.embed.timestamp ? new Date(interactiveMessage.message.embed.timestamp) : null,
                      color: interactiveMessage.message.embed.color ? resolveColor(interactiveMessage.message.embed.color as any) : null,
                      fields: interactiveMessage.message.embed.fields,
                      author: interactiveMessage.message.embed.author as any,
                      thumbnail: interactiveMessage.message.embed.thumbnail as any,
                      image: interactiveMessage.message.embed.image as any,
                      footer: interactiveMessage.message.embed.footer as any
                  }).toJSON()
              ]
            : [],
        components: resolveMessageComponents(interactiveMessage.components)
    }

    if (JSON.stringify(data.message) !== JSON.stringify(interactiveMessage.message)) {
        hasChanges = true
        message.content = data.message?.content ?? interactiveMessage.message.content
        message.embeds = data.message?.embed?.active
            ? [
                  new EmbedBuilder({
                      title: data.message.embed.title ? data.message.embed.title : interactiveMessage.message.embed.title,
                      description: data.message.embed.description ? data.message.embed.description : interactiveMessage.message.embed.description,
                      url: data.message.embed.url ? data.message.embed.url : interactiveMessage.message.embed.url,
                      timestamp: data.message.embed.timestamp
                          ? new Date(data.message.embed.timestamp)
                          : interactiveMessage.message.embed.timestamp
                          ? new Date(interactiveMessage.message.embed.timestamp)
                          : null,
                      color: data.message.embed.color
                          ? data.message.embed.color
                              ? resolveColor(data.message.embed.color as any)
                              : null
                          : interactiveMessage.message.embed.color
                          ? resolveColor(interactiveMessage.message.embed.color as any)
                          : null,
                      fields: data.message.embed.fields ?? interactiveMessage.message.embed.fields,
                      author: {
                          name: data.message.embed.author?.name ? data.message.embed.author.name : interactiveMessage.message.embed.author.name,
                          url: data.message.embed.author?.url ? data.message.embed.author.url : interactiveMessage.message.embed.author.url,
                          icon_url: data.message.embed.author?.icon_url
                              ? data.message.embed.author.icon_url
                              : interactiveMessage.message.embed.author.icon_url
                      },
                      thumbnail: (data.message.embed.thumbnail ? data.message.embed.thumbnail : interactiveMessage.message.embed.thumbnail) as any,
                      image: (data.message.embed.image ? data.message.embed.image : interactiveMessage.message.embed.image) as any,
                      footer: {
                          text: data.message.embed.footer?.text ? data.message.embed.footer.text : interactiveMessage.message.embed.footer.text,
                          icon_url: data.message.embed.footer?.icon_url
                              ? data.message.embed.footer.icon_url
                              : interactiveMessage.message.embed.footer.icon_url
                      }
                  }).toJSON()
              ]
            : []
    }

    if (JSON.stringify(data.components) !== JSON.stringify(interactiveMessage.components)) {
        hasChanges = true
        message.components = resolveMessageComponents(data.components)
    }

    if (hasChanges) {
        try {
            await DiscordUtils.rest.patch(DiscordUtils.restRoutes.channelMessage(interactiveMessage.channel_id, interactiveMessage.id), {
                body: message
            })

            await database.servers.updateOne(
                { _id: server._id, 'modules.interactive_messages.id': interactiveMessage.id },
                {
                    $set: {
                        'modules.interactive_messages.$.message': data.message,
                        'modules.interactive_messages.$.components': data.components
                    }
                }
            )
        } catch (err) {
            ctx.log.error({
                module: 'InteractiveMessages',
                action: 'UpdateMessage',
                err,
                guildId: server._id
            })

            ctx.throw(500, new APIError(5006))
        }
    }

    if (JSON.stringify(data.reactions) !== JSON.stringify(interactiveMessage.reactions)) {
        const added = data.reactions.filter(v => !interactiveMessage.reactions.some(vv => v.id === vv.id))
        const removed = interactiveMessage.reactions.filter(v => !data.reactions.some(vv => v.id === vv.id))

        for (const reaction of added) {
            try {
                await DiscordUtils.rest.put(
                    DiscordUtils.restRoutes.channelMessageOwnReaction(
                        interactiveMessage.channel_id,
                        interactiveMessage.id,
                        encodeURIComponent(reaction.emoji.id ? `${reaction.emoji.name}:${reaction.emoji.id}` : reaction.emoji.name)
                    )
                )
            } catch (err) {
                break
            }
        }

        for (const reaction of removed) {
            try {
                await DiscordUtils.rest.delete(
                    DiscordUtils.restRoutes.channelMessageOwnReaction(
                        interactiveMessage.channel_id,
                        interactiveMessage.id,
                        encodeURIComponent(reaction.emoji.id ? `${reaction.emoji.name}:${reaction.emoji.id}` : reaction.emoji.name)
                    )
                )
            } catch (err) {
                break
            }
        }

        await database.servers.updateOne(
            { _id: server._id, 'modules.interactive_messages.id': interactiveMessage.id },
            {
                $set: {
                    'modules.interactive_messages.$.reactions': data.reactions
                }
            }
        )
    }

    ctx.status = 200
    ctx.body = data
}
