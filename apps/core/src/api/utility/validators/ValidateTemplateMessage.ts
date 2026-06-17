import { type ServerMessageTemplate } from '@/database/schemas/Servers.js'
import { isObject } from '@/internals/utility/Utils.js'

export function validateTemplateMessage(template: ServerMessageTemplate) {
    const message: ServerMessageTemplate = {
        content: null,
        embed: {
            active: false,
            author: { name: null, url: null, icon_url: null },
            color: null,
            description: null,
            fields: [],
            footer: { text: null, icon_url: null },
            image: { url: null },
            thumbnail: { url: null },
            timestamp: null,
            title: null,
            url: null
        }
    }

    if (!isObject(template)) return message
    if (typeof template.content === 'string' || template.content === null) message.content = template.content
    if (!isObject(template.embed)) return message

    if (typeof template.embed.active === 'boolean') message.embed.active = template.embed.active

    if (isObject(template.embed.author)) {
        if (typeof template.embed.author.icon_url === 'string' || template.embed.author.icon_url === null)
            message.embed.author.icon_url = template.embed.author.icon_url
        if (typeof template.embed.author.name === 'string' || template.embed.author.name === null)
            message.embed.author.name = template.embed.author.name
        if (typeof template.embed.author.url === 'string' || template.embed.author.url === null)
            message.embed.author.url = template.embed.author.url
    }

    if (typeof template.embed.color === 'string' || template.embed.color === null)
        message.embed.color = template.embed.color
    if (typeof template.embed.description === 'string' || template.embed.description === null)
        message.embed.description = template.embed.description

    if (Array.isArray(template.embed.fields)) {
        const fields = []

        for (const field of template.embed.fields) {
            if (
                typeof field.name === 'string' &&
                typeof field.value === 'string' &&
                (typeof field.inline === 'boolean' || field.inline === null)
            )
                fields.push(field)
        }

        message.embed.fields = fields
    }

    if (isObject(template.embed.footer)) {
        if (typeof template.embed.footer.icon_url === 'string' || template.embed.footer.icon_url === null)
            message.embed.footer.icon_url = template.embed.footer.icon_url
        if (typeof template.embed.footer.text === 'string' || template.embed.footer.text === null)
            message.embed.footer.text = template.embed.footer.text
    }

    if (isObject(template.embed.image)) {
        if (typeof template.embed.image.url === 'string' || template.embed.image.url === null)
            message.embed.image.url = template.embed.image.url
    }

    if (isObject(template.embed.thumbnail)) {
        if (typeof template.embed.thumbnail.url === 'string' || template.embed.thumbnail.url === null)
            message.embed.thumbnail.url = template.embed.thumbnail.url
    }

    if (typeof template.embed.timestamp === 'string' || template.embed.timestamp === null)
        message.embed.timestamp = template.embed.timestamp
    if (typeof template.embed.title === 'string' || template.embed.title === null)
        message.embed.title = template.embed.title
    if (typeof template.embed.url === 'string' || template.embed.url === null) message.embed.url = template.embed.url

    // @ts-ignore
    if ('components' in template && Array.isArray(template.components)) message['components'] = template.components

    return message
}
