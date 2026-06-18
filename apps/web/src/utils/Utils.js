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
    return Object.entries(object).reduce((result, [key, value]) => {
        const baseValue = base[key]

        if (JSON.stringify(value) !== JSON.stringify(baseValue)) {
            result[key] =
                value !== null &&
                typeof value === 'object' &&
                baseValue !== null &&
                typeof baseValue === 'object' &&
                !(Array.isArray(value) || Array.isArray(baseValue))
                    ? objectDifferences(value, baseValue)
                    : value
        }

        return result
    }, {})
}

export function getLocale() {
    return (localStorage.getItem('locale') ?? navigator.language ?? navigator.languages?.[0] ?? 'en').split('-')[0]
}

export function getDefaultAvatarURL(id) {
    return `https://cdn.discordapp.com/embed/avatars/${(BigInt(id || '0') >> 22n) % 6n}.png`
}

export function getGuildIconURL(guildId, icon) {
    if (guildId && icon) {
        const ext = icon.startsWith('a_') ? 'gif' : 'png'
        return `https://cdn.discordapp.com/icons/${guildId}/${icon}.${ext}`
    }

    return getDefaultAvatarURL(guildId)
}

export function getUserAvatarURL(userId, avatar) {
    if (userId && avatar) {
        const ext = avatar.startsWith('a_') ? 'gif' : 'png'
        return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.${ext}`
    }

    return getDefaultAvatarURL(userId)
}

export function handleAxiosError(error) {
    console.error(error)

    if (error.response) {
        const { code, message } = error.response.data

        return {
            code: code ?? 0,
            message: message ?? error.message,
            status: error.response.status
        }
    }

    return {
        code: 0,
        message: error.message,
        status: null
    }
}

export function hmsToMS(hms) {
    return hms.split(':').reduce((x, y) => 60 * x + +y, 0) * 1000
}

export function splitRelativeTime(locale, value, unit) {
    const relativeTime = new Intl.RelativeTimeFormat(locale ?? getLocale(), { numeric: 'always' }),
        parts = relativeTime.formatToParts(value, unit)

    return parts
        .slice(1)
        .map(v => v.value)
        .join('')
}

/**
 * @param {number} value
 * @param {Intl.RelativeTimeFormatUnit} unit
 * @returns string
 */
export function pluralTime(value, unit) {
    const relativeTime = new Intl.RelativeTimeFormat(getLocale(), { numeric: 'always' })
    return relativeTime.formatToParts(value, unit).pop().value.trim()
}

export function openPopupWindow({ url, title, w, h }) {
    const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX
    const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY

    const width = window.innerWidth
        ? window.innerWidth
        : document.documentElement.clientWidth
          ? document.documentElement.clientWidth
          : screen.width
    const height = window.innerHeight
        ? window.innerHeight
        : document.documentElement.clientHeight
          ? document.documentElement.clientHeight
          : screen.height

    const systemZoom = width / window.screen.availWidth
    const left = (width - w) / 2 / systemZoom + dualScreenLeft
    const top = (height - h) / 2 / systemZoom + dualScreenTop
    const newWindow = window.open(
        url,
        title,
        `
            scrollbars=yes,
            width=${w / systemZoom},
            height=${h / systemZoom},
            top=${top},
            left=${left}
        `
    )

    if (window.focus) newWindow.focus()
    return newWindow
}

export function chunkArray(array, length) {
    if (!Array.isArray(array)) throw new TypeError('IS_NOT_ARRAY')
    if (typeof length != 'number') throw new TypeError('LENGTH_IS_NOT_INTEGER')

    const arr = []

    for (let i = 0; i < array.length; i += length) {
        arr.push(array.slice(i, i + length))
    }

    return arr
}

export function isEven(number) {
    return number % 2 === 0
}

export function frameNumber(value, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
    if (typeof value !== 'number' || isNaN(value)) value = min
    else if (value < min) value = min
    else if (value > max) value = max
    return value
}

export function sleep(ms = 2000) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
