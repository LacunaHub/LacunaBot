import { isArray, isEqual, isObject } from 'lodash/fp'
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

export function resolveCustomCommandJSON(data) {
    if (!data) throw new Error('NO_DATA_FOR_RESOLVE')

    let json = {
        options: [],
        components: [],
        command: {
            type: 1,
            name: typeof data.command?.name === 'string' ? data.command.name : '',
            description: typeof data.command?.description === 'string' ? data.command.description.slice(0, 100) : null,
            options: []
        }
    }

    if (Array.isArray(data.options)) {
        if (data.options.includes('THROTTLING')) {
            json.options.push('THROTTLING')

            json.throttling = {
                type:
                    typeof data.throttling?.type === 'string' &&
                    ['PER_USER', 'PER_CHANNEL', 'PER_GUILD'].includes(data.throttling.type)
                        ? data.throttling.type
                        : 'PER_USER',
                max_uses:
                    typeof data.throttling?.max_uses === 'number' &&
                    data.throttling.max_uses >= 1 &&
                    data.throttling.max_uses <= 10
                        ? data.throttling.max_uses
                        : 1,
                timeout:
                    typeof data.throttling?.timeout === 'number' &&
                    [60, 120, 300, 600, 900, 1800, 3600, 7200, 21600, 43200, 64800, 86400].includes(
                        data.throttling.timeout
                    )
                        ? data.throttling.timeout
                        : 60
            }
        }
    }

    if (Array.isArray(data.command?.options)) {
        for (const option of data.command.options.slice(0, 25)) {
            let opt = {
                type: [3, 4, 5, 6, 7, 8, 9, 10].includes(option.type) ? option.type : 3,
                name: typeof option.name === 'string' ? option.name : 'argument',
                description:
                    typeof option.description === 'string' ? option.description.slice(0, 100) : 'Argument Description',
                required: Boolean(option.required)
            }

            if (Array.isArray(option.choices) && [3, 4, 10].includes(option.type)) {
                opt.choices = []

                for (const choice of option.choices.slice(0, 25)) {
                    opt.choices.push({
                        name: typeof choice.name === 'string' ? choice.name.slice(0, 100) : 'choice',
                        value:
                            option.type === 3
                                ? String(choice.value)
                                : isNaN(Number(choice.value))
                                  ? 1
                                  : Number(choice.value)
                    })
                }
            }

            json.command.options.push(opt)
        }
    }

    if (Array.isArray(data.components)) {
        json.components = resolveCustomBehaviorComponents(data.components)
    }

    return json
}

export function resolveAutomationJSON(data) {
    if (!data) throw new Error('NO_DATA_FOR_RESOLVE')

    let json = {
        id: suid(6),
        name: typeof data.name === 'string' ? data.name : null,
        options: [],
        trigger:
            typeof data.trigger === 'string' &&
            [
                'GUILD_MEMBER_ADD',
                'GUILD_MEMBER_REMOVE',
                'INTERACTION_BUTTON',
                'INTERACTION_SELECT_MENU',
                'INTERACTION_MODAL_SUBMIT',
                'MESSAGE_CREATE',
                'MESSAGE_DELETE',
                'MESSAGE_UPDATE',
                'ROLE_MEMBER_ADD',
                'ROLE_MEMBER_REMOVE',
                'VOICE_CONNECT',
                'VOICE_DISCONNECT'
            ].includes(data.trigger)
                ? data.trigger
                : null,
        components: []
    }

    if (Array.isArray(data.components)) {
        json.components = resolveCustomBehaviorComponents(data.components)
    }

    return json
}

function resolveCustomBehaviorComponents(rawComponents) {
    const components = []

    for (const component of rawComponents) {
        if (component.type === 'CONDITION') {
            if (component.condition?.type === 'COMPARE_VALUES') {
                let compare_values = {
                    options: [],
                    operator: [
                        'EQUAL',
                        'NOT_EQUAL',
                        'GREATER_THAN',
                        'LESS_THAN',
                        'STARTS_WITH',
                        'ENDS_WITH',
                        'CONTAINS',
                        'NOT_CONTAINS'
                    ].includes(component.condition.compare_values?.operator)
                        ? component.condition.compare_values.operator
                        : 'EQUAL',
                    left:
                        typeof component.condition.compare_values?.left === 'string'
                            ? component.condition.compare_values.left
                            : '',
                    right:
                        typeof component.condition.compare_values?.right === 'string'
                            ? component.condition.compare_values.right
                            : ''
                }

                if (Array.isArray(component.condition.compare_values?.options)) {
                    if (component.condition.compare_values.options.includes('FALSE_REPLY')) {
                        if (component.condition.compare_values.false_reply) {
                            compare_values.false_reply = {
                                content:
                                    typeof component.condition.compare_values.false_reply.content === 'string'
                                        ? component.condition.compare_values.false_reply.content
                                        : '',
                                embed: resolveEmbed(component.condition.compare_values.false_reply.embed)
                            }

                            compare_values.options.push('FALSE_REPLY')
                        }
                    }

                    if (component.condition.compare_values.options.includes('FALSE_REPLY_EPHEMERAL'))
                        compare_values.options.push('FALSE_REPLY_EPHEMERAL')
                }

                components.push({
                    type: component.type,
                    condition: {
                        type: component.condition.type,
                        compare_values
                    }
                })
            }
        }

        if (component.type === 'ACTION') {
            if (component.action?.type === 'EXECUTE_CODE') {
                components.push({
                    type: component.type,
                    action: {
                        type: component.action.type,
                        execute_code: {
                            code:
                                typeof component.action.execute_code?.code === 'string'
                                    ? component.action.execute_code.code
                                    : ''
                        }
                    }
                })
            }

            if (component.action?.type === 'REPLY') {
                components.push({
                    type: component.type,
                    action: {
                        type: component.action.type,
                        reply: {
                            options: Array.isArray(component.action.reply?.options)
                                ? component.action.reply.options.filter(i => ['EPHEMERAL'].includes(i))
                                : [],
                            message: {
                                content:
                                    typeof component.action.reply?.message?.content === 'string'
                                        ? component.action.reply.message.content
                                        : '',
                                embed: resolveEmbed(component.action.reply?.message?.embed)
                            }
                        }
                    }
                })
            }

            if (component.action?.type === 'SEND_MESSAGE') {
                components.push({
                    type: component.type,
                    action: {
                        type: component.action.type,
                        send_message: {
                            options: Array.isArray(component.action.send_message?.options)
                                ? component.action.send_message.options.filter(i => ['TTS'].includes(i))
                                : [],
                            format:
                                typeof component.action.send_message?.format === 'string' &&
                                ['CHANNEL', 'CURRENT_CHANNEL'].includes(component.action.send_message.format)
                                    ? component.action.send_message.format
                                    : 'CHANNEL',
                            channel_id: null,
                            message: {
                                content:
                                    typeof component.action.send_message?.message?.content === 'string'
                                        ? component.action.send_message.message.content
                                        : '',
                                embed: resolveEmbed(component.action.send_message?.message?.embed)
                            }
                        }
                    }
                })
            }

            if (component.action?.type === 'MODIFY_ROLES') {
                components.push({
                    type: component.type,
                    action: {
                        type: component.action.type,
                        modify_roles: {
                            add: [],
                            remove: [],
                            user_id:
                                typeof component.action.modify_roles?.user_id === 'string'
                                    ? component.action.modify_roles.user_id
                                    : null
                        }
                    }
                })
            }

            if (component.action?.type === 'FORWARD_TO_COMMAND') {
                components.push({
                    type: component.type,
                    action: {
                        type: component.action.type,
                        forward_to_command:
                            typeof component.action.forward_to_command === 'string'
                                ? component.action.forward_to_command
                                : 'about'
                    }
                })
            }

            if (component.action?.type === 'MODIFY_WALLET') {
                components.push({
                    type: component.type,
                    action: {
                        type: component.action.type,
                        modify_wallet: {
                            operator:
                                typeof component.action.modify_wallet?.operator === 'string' &&
                                ['INCREMENT', 'DECREMENT'].includes(component.action.modify_wallet.operator)
                                    ? component.action.modify_wallet.operator
                                    : 'INCREMENT',
                            amount:
                                typeof component.action.modify_wallet?.amount === 'string'
                                    ? component.action.modify_wallet.amount
                                    : '0',
                            user_id:
                                typeof component.action.modify_wallet?.user_id === 'string'
                                    ? component.action.modify_wallet.user_id
                                    : null,
                            currency_id:
                                typeof component.action.modify_wallet?.currency_id === 'string'
                                    ? component.action.modify_wallet.currency_id
                                    : null
                        }
                    }
                })
            }

            if (component.action?.type === 'SHOW_MODAL') {
                const { show_modal } = component.action

                components.push({
                    type: component.type,
                    action: {
                        type: component.action.type,
                        show_modal: {
                            title: typeof show_modal.title === 'string' ? show_modal.title : null,
                            customId: typeof show_modal.customId === 'string' ? show_modal.customId : null,
                            components: Array.isArray(show_modal.components)
                                ? show_modal.components.map(row => {
                                      return row.map(comp => {
                                          return {
                                              type: 'TextInput',
                                              customId: typeof comp.customId === 'string' ? comp.customId : 'field-id',
                                              label: typeof comp.label === 'string' ? comp.label : 'Field',
                                              maxLength: typeof comp.minLength === 'number' ? comp.maxLength : 4000,
                                              minLength: typeof comp.minLength === 'number' ? comp.minLength : 0,
                                              placeholder:
                                                  typeof comp.placeholder === 'string' ? comp.placeholder : null,
                                              required: Boolean(comp.required),
                                              style: ['Short', 'Paragraph'].includes(comp.style) ? comp.style : 'Short',
                                              value: typeof comp.value === 'string' ? comp.value : null
                                          }
                                      })
                                  })
                                : []
                        }
                    }
                })
            }

            if (component.action?.type === 'OVERWRITE_CHANNEL_PERMISSIONS') {
                const { overwrite_channel_permissions } = component.action

                components.push({
                    type: component.type,
                    action: {
                        type: component.action.type,
                        overwrite_channel_permissions: {
                            channels:
                                Array.isArray(overwrite_channel_permissions.channels) &&
                                overwrite_channel_permissions.channels.every(i => typeof i === 'string')
                                    ? overwrite_channel_permissions.channels
                                    : [],
                            permissions:
                                typeof overwrite_channel_permissions.permissions === 'object' &&
                                overwrite_channel_permissions.permissions !== null &&
                                Object.values(overwrite_channel_permissions.permissions).every(
                                    i => typeof i === 'boolean' || i === null
                                )
                                    ? overwrite_channel_permissions.permissions
                                    : {},
                            user_or_role:
                                typeof overwrite_channel_permissions.user_or_role === 'string'
                                    ? overwrite_channel_permissions.user_or_role
                                    : ''
                        }
                    }
                })
            }
        }
    }

    return components
}

export function getLocale() {
    return (localStorage.getItem('locale') ?? navigator.language ?? navigator.languages?.[0] ?? 'en').split('-')[0]
}

export function getDefaultAvatarURL(id) {
    return `https://cdn.discordapp.com/embed/avatars/${(BigInt(id || '0') >> 22n) % 6n}.png`
}

export function getGuildIconURL(guildId, icon) {
    if (guildId && icon) {
        const ext = avatar.startsWith('a_') ? 'gif' : 'png'
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
