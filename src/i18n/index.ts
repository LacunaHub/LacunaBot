import logger from '../internals/Logger'
import { resolveObjectPath } from '../internals/utility/Utils'
import en from './en/messages.json'
import ru from './ru/messages.json'
import uk from './uk/messages.json'

const messages = { en, ru, uk }

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
    const string = resolveObjectPath(key, messages[locale] ?? messages.ru) ?? resolveObjectPath(key, messages.ru) ?? key

    if (string === key) {
        logger.warn(`[i18n] Missing localization string ${string}`)
    }

    return format(string, params)
}

/**
 * string format
 *
 * ru and uk: "{n} ends with 1 | {n} ends with 2-4 | {n} ends with 0, 5-9 and for 11-19"
 *
 * en: "{n} one | {n} two and more"
 */
export function pluralize(locale: string, key: string, count: number) {
    const pluralRules = new Intl.PluralRules(locale)
    const string = resolveObjectPath(key, messages[locale] ?? messages.ru) ?? resolveObjectPath(key, messages.ru) ?? key
    const stringParts = string.split(/\s*\|\s*/)
    const grammaticalNumber = pluralRules.select(count)

    let choice: number = 0

    if (locale === 'ru' || locale === 'uk') {
        switch (grammaticalNumber) {
            case 'one':
                choice = 0
                break

            case 'few':
                choice = 1
                break

            case 'many':
                choice = 2
                break
        }
    }

    if (locale === 'en') {
        switch (grammaticalNumber) {
            case 'one':
                choice = 0
                break

            case 'other':
                choice = 1
                break
        }
    }

    return format(stringParts[choice], { n: count })
}

export function isSupported(locale: string, bool = false) {
    if (bool) return !!messages[locale]

    return !!messages[locale] ? locale : 'en'
}

export default { messages, locale, format, t, pluralize, isSupported }
