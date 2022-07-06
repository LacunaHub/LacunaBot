import logger from '../internals/Logger'
import { resolveObjectPath } from '../internals/utility/Utils'
import ruRU from './ru-RU/messages.json'

const messages = {
    ru: ruRU
}

export function locale(locale: string): typeof messages.ru {
    return messages[locale] ?? messages.ru
}

export function format(string: string, params?: any[] | { [key: string]: any }) {
    if (Array.isArray(params)) {
        const patterns = (string.match(/{(\w+|\d+)}/g) ?? []) as string[]

        for (const pattern of patterns) {
            const index = patterns.indexOf(pattern)

            string = string.replace(pattern, () => params[index])
        }
    }

    if (typeof params === 'object' && params !== null) {
        for (const key of Object.keys(params)) {
            const regexp = new RegExp(`{${key}}`, 'gi')

            string = string.replace(regexp, () => params[key])
        }
    }

    return string
}

export function t(locale: string, key: string, params?: any[] | { [key: string]: any }) {
    const string = resolveObjectPath(key, messages[locale]) ?? resolveObjectPath(key, messages.ru) ?? key

    if (string === key) {
        logger.warn(`[i18n]: Missing localization string ${string}`)
    }

    return format(string, params)
}

export default { messages, locale, format, t }
