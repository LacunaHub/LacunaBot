import {
    APIEmbed,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ModalActionRowComponentBuilder,
    StringSelectMenuBuilder,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js'
import { parseString } from 'xml2js'

export function truncateArray(array: any[], limit: number = 15, separator: string = '\n'): string {
    if (!Array.isArray(array)) throw new TypeError('IS_NOT_ARRAY')
    if (typeof limit != 'number') throw new TypeError('LIMIT_IS_NOT_INTEGER')
    if (typeof separator != 'string') throw new TypeError('SEPARATOR_IS_NOT_STRING')

    if (array.length > limit) {
        const length = array.length - limit

        array = array.slice(0, limit)
        array.push(`${length} ...`)
    }

    return array.join(separator)
}

export function shuffleArray(array: any[]): any[] {
    if (!Array.isArray(array)) throw new TypeError('IS_NOT_ARRAY')

    for (let i = array.length - 1, j = Math.floor(Math.random() * (i + 1)); i > 0; i--) {
        ;[array[i], array[j]] = [array[j], array[i]]
    }

    return array
}

export function chunkArray(array: any[], length: number): any[] {
    if (!Array.isArray(array)) throw new TypeError('IS_NOT_ARRAY')
    if (typeof length != 'number') throw new TypeError('LENGTH_IS_NOT_INTEGER')

    const arr = []

    for (let i = 0; i < array.length; i += length) {
        arr.push(array.slice(i, i + length))
    }

    return arr
}

export function truncateString(str: string, limit: number = 100, end: string = '...'): string {
    if (typeof str != 'string') throw new TypeError('STR_IS_NOT_STRING')
    if (typeof limit != 'number') throw new TypeError('LIMIT_IS_NOT_INTEGER')
    if (typeof end != 'string') throw new TypeError('END_IS_NOT_STRING')

    return str.length > limit ? str.substring(0, limit - end.length) + end : str
}

export function splitStringCase(str: string): { upper: string[]; lower: string[]; length: number } {
    if (typeof str != 'string') throw new TypeError('STR_IS_NOT_STRING')

    const upper = [],
        lower = []

    // remove all characters except this one.
    str = str.replace(/([^a-zа-яёй]+)/gi, '')

    for (let i = 0; i < str.length; i++) {
        if (str.charAt(i) === str.charAt(i).toUpperCase()) {
            upper.push(str.charAt(i))
        } else if (str.charAt(i) === str.charAt(i).toLowerCase()) {
            lower.push(str.charAt(i))
        }
    }

    return { upper, lower, length: str.length }
}

export function removeDiscordPatterns(str: string): string {
    if (typeof str != 'string') throw new TypeError('STR_IS_NOT_STRING')

    return str
        .replace(/<@!?\d+>/g, '')
        .replace(/<@&\d+>/g, '')
        .replace(/<#\d+>/g, '')
        .replace(/<a?:.+:\d+>/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim()
}

export function escapeRegexp(str: string): string {
    if (typeof str != 'string') throw new TypeError('STR_IS_NOT_STRING')

    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function parseCommandArguments(string: string): string[] {
    if (typeof string !== 'string') return []

    const args = []
    let str = string.trim()

    while (str.length) {
        let arg

        if (str.startsWith('"') && str.indexOf('"', 1) > 0) {
            arg = str.slice(1, str.indexOf('"', 1))
            str = str.slice(str.indexOf('"', 1) + 1)
        } else if (str.startsWith("'") && str.indexOf("'", 1) > 0) {
            arg = str.slice(1, str.indexOf("'", 1))
            str = str.slice(str.indexOf("'", 1) + 1)
        } else if (str.startsWith('```') && str.indexOf('```', 3) > 0) {
            arg = str.slice(3, str.indexOf('```', 3))
            str = str.slice(str.indexOf('```', 3) + 3)
        } else {
            arg = str.split(/\s+/g)[0].trim()
            str = str.slice(arg.length)
        }

        args.push(arg.trim().replace(/\s{2,}/, ' '))
        str = str.trim()
    }

    return args
}

export function normalizeCommandOption(option: string) {
    return truncateString(option.replace(/[^-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]/gu, '-').toLowerCase(), 32)
}

export function resolveObjectPath(path: string, object: {}): any {
    if (typeof path != 'string') throw new TypeError('PATH_IS_NOT_STRING')
    if (object === null || typeof object != 'object') throw new TypeError('OBJECT_IS_NOT_OBJECT')

    return path.split('.').reduce((x, y) => {
        return x ? x[y] : null
    }, object)
}

export function dotNotateObject(object: {}, target?: {}, prefix?: string): {} {
    if (object == null || typeof object != 'object') throw new TypeError('OBJECT_IS_NOT_OBJECT')
    ;((target = target || {}), (prefix = prefix || ''))

    Object.keys(object).forEach(key => {
        if (typeof object[key] === 'object' && object[key] !== null && !Array.isArray(object[key])) {
            dotNotateObject(object[key], target, prefix + key + '.')
        } else {
            return (target[prefix + key] = object[key])
        }
    })

    return target
}

export function createEnum(keys: any[]): {} {
    const obj = {}

    for (const [index, key] of keys.entries()) {
        if (key === null) continue

        obj[key] = index
        obj[index] = key
    }

    return obj
}

export function shadeColor(color: string, amount: number): string {
    return (
        '#' +
        color
            .replace(/^#/, '')
            .replace(/../g, color =>
                ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substring(-2)
            )
    )
}

export function convertXml2Json(str: Buffer, options = {}) {
    return new Promise((resolve, reject) => {
        parseString(str, options, (err, result) => {
            err ? reject(err) : resolve(result)
        })
    })
}

export function isValidHttpUrl(string: string) {
    let url: URL

    try {
        url = new URL(string)
    } catch (_) {
        return false
    }

    return url.protocol === 'http:' || url.protocol === 'https:'
}

export function snakeToPascalCase(string: string) {
    return string
        .split('/')
        .map(snake =>
            snake
                .split('_')
                .map(substr => substr.charAt(0).toUpperCase() + substr.slice(1).toLowerCase())
                .join('')
        )
        .join('/')
}

export function generateSimpleId(length: number = 4) {
    if (typeof length !== 'number') length = 4
    if (length < 4) length = 4
    if (length > 11) length = 11

    return `${Math.random().toString(36).substring(2, length).toUpperCase()}`
}

export function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
}

export function getTrackSourceByUrl(url: string) {
    if (url.includes('open.spotify.com')) return 'Spotify'
    if (url.includes('music.yandex')) return 'YandexMusic'
    if (url.includes('soundcloud.com')) return 'SoundCloud'

    return 'UnknownSource'
}

export function transformMessageEmbeds(embeds: APIEmbed[]) {
    if (!Array.isArray(embeds)) return undefined

    return embeds.slice(0, 5).map(embed => {
        return new EmbedBuilder(embed).toJSON()
    })
}

export function transformMessageComponents(components: any[][]) {
    if (!Array.isArray(components)) return undefined

    components = components.filter(i => Array.isArray(i))

    return components.slice(0, 5).map(row => {
        return new ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>()
            .addComponents(
                row.map(component => {
                    if (component.type === 'Button') {
                        const button = new ButtonBuilder()

                        if (typeof component.customId === 'string') button.setCustomId(`UD-${component.customId}`)
                        button.setDisabled(Boolean(component.disabled))
                        if (component.emoji && component.emoji?.name)
                            button.setEmoji(component.emoji.id ? component.emoji : component.emoji.name)
                        if (typeof component.label === 'string') button.setLabel(component.label)
                        button.setStyle(ButtonStyle[component.style] as any)
                        if (typeof component.url === 'string') button.setURL(component.url)

                        return button
                    }

                    if (component.type === 'SelectMenu') {
                        const selectMenu = new StringSelectMenuBuilder()

                        if (typeof component.customId === 'string') selectMenu.setCustomId(`UD-${component.customId}`)
                        selectMenu.setDisabled(Boolean(component.disabled))
                        if (typeof component.maxValues === 'number') selectMenu.setMaxValues(component.maxValues)
                        if (typeof component.minValues === 'number') selectMenu.setMinValues(component.minValues)
                        selectMenu.setOptions(...component.options)
                        if (typeof component.placeholder === 'string') selectMenu.setPlaceholder(component.placeholder)

                        return selectMenu
                    }
                })
            )
            .toJSON()
    })
}

export function transformModalComponents(components: any[][]) {
    if (!Array.isArray(components)) return undefined

    components = components.filter(i => Array.isArray(i))

    return components.slice(0, 5).map(row => {
        return new ActionRowBuilder<ModalActionRowComponentBuilder>()
            .addComponents(
                row.map(component => {
                    const field = new TextInputBuilder()

                    if (typeof component.customId === 'string') field.setCustomId(component.customId)
                    if (typeof component.label === 'string') field.setLabel(component.label)
                    if (typeof component.maxLength === 'number') field.setMaxLength(component.maxLength)
                    if (typeof component.minLength === 'number') field.setMinLength(component.minLength)
                    if (typeof component.placeholder === 'string') field.setPlaceholder(component.placeholder)
                    field.setRequired(Boolean(component.required))
                    field.setStyle(TextInputStyle[component.style] as any)
                    if (typeof component.value === 'string') field.setValue(component.value)

                    return field
                })
            )
            .toJSON()
    })
}

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked, or until the next browser frame is drawn. The debounced function
 * comes with a `cancel` method to cancel delayed `func` invocations and a
 * `flush` method to immediately invoke them. Provide `options` to indicate
 * whether `func` should be invoked on the leading and/or trailing edge of the
 * `wait` timeout. The `func` is invoked with the last arguments provided to the
 * debounced function. Subsequent calls to the debounced function return the
 * result of the last `func` invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the debounced function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * If `wait` is omitted in an environment with `requestAnimationFrame`, `func`
 * invocation will be deferred until the next frame is drawn (typically about
 * 16ms).
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `debounce` and `throttle`.
 *
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0]
 *  The number of milliseconds to delay; if omitted, `requestAnimationFrame` is
 *  used (if available).
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=false]
 *  Specify invoking on the leading edge of the timeout.
 * @param {number} [options.maxWait]
 *  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // Avoid costly calculations while the window size is in flux.
 * jQuery(window).on('resize', debounce(calculateLayout, 150))
 *
 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
 * jQuery(element).on('click', debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }))
 *
 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
 * const debounced = debounce(batchLog, 250, { 'maxWait': 1000 })
 * const source = new EventSource('/stream')
 * jQuery(source).on('message', debounced)
 *
 * // Cancel the trailing debounced invocation.
 * jQuery(window).on('popstate', debounced.cancel)
 *
 * // Check for pending invocations.
 * const status = debounced.pending() ? "Pending..." : "Ready"
 */
export function debounce(
    func: Function,
    wait: number = 0,
    options?: { leading: boolean; maxWait: number; trailing: boolean }
): Function {
    let lastArgs: any,
        lastThis: any,
        maxWait: any,
        result: any,
        timerId: any,
        lastCallTime: any,
        lastInvokeTime: number = 0,
        leading: boolean = false,
        maxing: boolean = false,
        trailing: boolean = true

    if (typeof func !== 'function') {
        throw new TypeError('Expected a function')
    }

    wait = +wait || 0

    if (typeof options === 'object' && options !== null) {
        leading = !!options.leading
        maxing = 'maxWait' in options
        maxWait = maxing ? Math.max(+options.maxWait || 0, wait) : maxWait
        trailing = 'trailing' in options ? !!options.trailing : trailing
    }

    function invokeFunc(time: number) {
        const args = lastArgs
        const thisArg = lastThis

        lastArgs = lastThis = undefined
        lastInvokeTime = time
        result = func.apply(thisArg, args)

        return result
    }

    function startTimer(pendingFunc: () => void, milliseconds: number) {
        return setTimeout(pendingFunc, milliseconds)
    }

    function cancelTimer(id: string | number | NodeJS.Timeout) {
        clearTimeout(id)
    }

    function leadingEdge(time: number) {
        // Reset any `maxWait` timer.
        lastInvokeTime = time
        // Start the timer for the trailing edge.
        timerId = startTimer(timerExpired, wait)
        // Invoke the leading edge.
        return leading ? invokeFunc(time) : result
    }

    function remainingWait(time: number) {
        const timeSinceLastCall = time - lastCallTime
        const timeSinceLastInvoke = time - lastInvokeTime
        const timeWaiting = wait - timeSinceLastCall

        return maxing ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting
    }

    function shouldInvoke(time: number) {
        const timeSinceLastCall = time - lastCallTime
        const timeSinceLastInvoke = time - lastInvokeTime

        // Either this is the first call, activity has stopped and we're at the
        // trailing edge, the system time has gone backwards and we're treating
        // it as the trailing edge, or we've hit the `maxWait` limit.
        return (
            lastCallTime === undefined ||
            timeSinceLastCall >= wait ||
            timeSinceLastCall < 0 ||
            (maxing && timeSinceLastInvoke >= maxWait)
        )
    }

    function timerExpired() {
        const time = Date.now()

        if (shouldInvoke(time)) {
            return trailingEdge(time)
        }

        // Restart the timer.
        timerId = startTimer(timerExpired, remainingWait(time))

        return undefined
    }

    function trailingEdge(time: number) {
        timerId = undefined

        // Only invoke if we have `lastArgs` which means `func` has been
        // debounced at least once.
        if (trailing && lastArgs) {
            return invokeFunc(time)
        }

        lastArgs = lastThis = undefined

        return result
    }

    function cancel() {
        if (timerId !== undefined) {
            cancelTimer(timerId)
        }

        lastInvokeTime = 0
        lastArgs = lastCallTime = lastThis = timerId = undefined
    }

    function flush() {
        return timerId === undefined ? result : trailingEdge(Date.now())
    }

    function pending() {
        return timerId !== undefined
    }

    function debounced(...args: any[]) {
        const time = Date.now()
        const isInvoking = shouldInvoke(time)

        lastArgs = args
        lastThis = this
        lastCallTime = time

        if (isInvoking) {
            if (timerId === undefined) {
                return leadingEdge(lastCallTime)
            }
            if (maxing) {
                // Handle invocations in a tight loop.
                timerId = startTimer(timerExpired, wait)

                return invokeFunc(lastCallTime)
            }
        }

        if (timerId === undefined) {
            timerId = startTimer(timerExpired, wait)
        }

        return result
    }

    debounced.cancel = cancel
    debounced.flush = flush
    debounced.pending = pending

    return debounced
}

export function hmsToMS(hms: string) {
    return hms.split(':').reduce((x, y) => 60 * x + +y, 0) * 1000
}

export function parseJSON<T = any>(text: string, reviver?: (this: any, key: string, value: any) => any): T {
    try {
        return JSON.parse(text, reviver)
    } catch (err) {
        return null
    }
}

export function isObject(value: any): boolean {
    return typeof value === 'object' && !Array.isArray(value) && value !== null
}

export function indexToLetter(index: number) {
    return 'abcdefghijklmnopqrstuvwxyz'.split('').at(index)
}

export function bufferToDataURL(buffer: Buffer, mimeType: string = 'image/png') {
    const base64 = buffer.toString('base64')
    return `data:${mimeType};base64,${base64}`
}

export async function fetchFile(url: string) {
    const res = await fetch(url),
        buffer = Buffer.from(await res.arrayBuffer())

    return { data: buffer, mimeType: res.headers.get('content-type') }
}
