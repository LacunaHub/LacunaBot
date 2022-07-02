import { isEqual, isObject, isArray } from 'lodash/fp'
import reduce from 'lodash/reduce'

export function hashCode(str) {
    let hash = 0

    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }

    let colour = '#'

    for (let i = 0; i < 3; i++) {
        let value = (hash >> (i * 8)) & 0xff
        colour += ('00' + value.toString(16)).substr(-2)
    }

    return colour
}

export function hexToRGB(hex) {
    hex = hex.replace(/^#/, '')

    if (hex.length === 8) {
        hex = hex.slice(0, 6)
    }

    if (hex.length === 4) {
        hex = hex.slice(0, 3)
    }

    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    }

    const number = Number.parseInt(hex, 16)
    const red = number >> 16
    const green = (number >> 8) & 255
    const blue = number & 255

    return [red, green, blue]
}

export function decimalToHex(color) {
    color = color.toString(16).toUpperCase()
    return ('000000' + color).slice(-6)
}

export function resolveEmbed(embed) {
    return {
        active: Boolean(embed.active),
        title: typeof embed.title == 'string' ? embed.title.slice(0, 256) || null : null,
        description: typeof embed.description == 'string' ? embed.description.slice(0, 4096) || null : null,
        url: embed.url || null,
        timestamp: embed.timestamp || null,
        color: embed.color || null,
        fields: Array.isArray(embed.fields)
            ? embed.fields
                  .filter(i => typeof i.name == 'string' && i.name && typeof i.value == 'string' && i.value)
                  .map(i => ({ name: i.name.slice(0, 256), value: i.value.slice(0, 1024), inline: Boolean(i.inline) }))
                  .slice(0, 25)
            : [],
        thumbnail: embed.thumbnail
            ? {
                  url: embed.thumbnail.url || null
              }
            : null,
        image: embed.image
            ? {
                  url: embed.image.url || null
              }
            : null,
        author: embed.author
            ? {
                  name: typeof embed.author.name == 'string' ? embed.author.name.slice(0, 256) || null : null,
                  url: embed.author.url || null,
                  icon_url: embed.author.icon_url || null
              }
            : null,
        footer: embed.footer
            ? {
                  text: typeof embed.footer.text == 'string' ? embed.footer.text.slice(0, 2048) || null : null,
                  icon_url: embed.footer.icon_url || null
              }
            : null
    }
}

export function parseEmoji(value) {
    if (value.includes('%')) value = decodeURIComponent(value)
    if (!value.includes(':')) return { animated: false, name: value, id: null }

    const match = value.match(/<?(?:(a):)?(\w{2,32}):(\d{17,19})?>?/)
    if (!match) return null

    return { animated: Boolean(match[1]), name: match[2], id: match[3] || null }
}

export function suid(length) {
    if (typeof length !== 'number') length = 4
    if (length < 4) length = 4
    if (length > 11) length = 11

    return `${Math.random().toString(36).slice(2).substring(0, length).toUpperCase()}`
}

export function objectDifferences(object, base) {
    return reduce(
        object,
        (result, value, key) => {
            if (!isEqual(value, base[key])) {
                result[key] =
                    isObject(value) && isObject(base[key]) && !(isArray(value) && isArray(base[key]))
                        ? objectDifferences(value, base[key])
                        : value
            }

            return result
        },
        {}
    )
}
