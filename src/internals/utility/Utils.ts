const snowflakeRegexp = /\d{17,20}/

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
        [array[i], array[j]] = [array[j], array[i]]
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

    return str.length > limit ? str.substring(0, limit) + end : str
}

export function splitStringCase(str: string): { upper: string[], lower: string[], length: number } {
    if (typeof str != 'string') throw new TypeError('STR_IS_NOT_STRING')

    const upper = [], lower = []

    str = str.replace(/([^a-zа-яёй]+)/gi, '')

    for (let i = 0; i < str.length; i++) {
        if (str.charAt(i) === str.charAt(i).toUpperCase()) {
            upper.push(str.charAt(i))
        }

        else if (str.charAt(i) === str.charAt(i).toLowerCase()) {
            lower.push(str.charAt(i))
        }
    }

    return { upper, lower, length: str.length }
}

export function isSnowflake(str: string): boolean {
    if (typeof str != 'string') throw new TypeError('STR_IS_NOT_STRING')

    return snowflakeRegexp.test(str)
}

export function parseSnowflake(str: string): string | null {
    if (typeof str != 'string') throw new TypeError('STR_IS_NOT_STRING')

    return str.match(snowflakeRegexp)?.toString() ?? null
}

export function removeDiscordPatterns(str: string): string {
    if (typeof str != 'string') throw new TypeError('STR_IS_NOT_STRING')

    return str.replace(/<@!?\d+>/g, '').replace(/<@&\d+>/g, '').replace(/<#\d+>/g, '').replace(/<a?:.+:\d+>/g, '').replace(/\s{2,}/g, ' ').trim()
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
        }
        
        else if (str.startsWith("'") && str.indexOf("'", 1) > 0) {
            arg = str.slice(1, str.indexOf("'", 1))
            str = str.slice(str.indexOf("'", 1) + 1)
        }
        
        else if (str.startsWith("```") && str.indexOf("```", 3) > 0) {
            arg = str.slice(3, str.indexOf("```", 3))
            str = str.slice(str.indexOf("```", 3) + 3)
        }
        
        else {
            arg = str.split(/\s+/g)[0].trim()
            str = str.slice(arg.length)
        }

        args.push(arg.trim().replace(/\s{2,}/, ' '))
        str = str.trim()
    }
  
    return args
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

    target = target || {}, prefix = prefix || ''
  
    Object.keys(object).forEach(key => {
        if (typeof(object[key]) === "object" && object[key] !== null && !Array.isArray(object[key])) {
            dotNotateObject(object[key], target, prefix + key + '.')
        } else {
            return target[prefix + key] = object[key]
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
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substring(-2))
}

export default {
    truncateArray,
    shuffleArray,
    chunkArray,
    truncateString,
    splitStringCase,
    isSnowflake,
    parseSnowflake,
    removeDiscordPatterns,
    escapeRegexp,
    parseCommandArguments,
    resolveObjectPath,
    dotNotateObject,
    createEnum,
    shadeColor
}