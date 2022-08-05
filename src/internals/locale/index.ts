import russian from './languages/russian.json'

export function locale(locale: string) {
    let file: typeof russian

    switch (locale) {
        case 'ru':
            file = russian
            break

        case 'en':
            file = russian
            break
    }

    return file
}

export function format(str: string, ...args: any[]): string {
    const patterns = str.match(/{\d+}/g) || []

    for (const pattern of patterns) {
        const i = patterns.indexOf(pattern)

        str = str.replace(pattern, () => {
            return args[i]
        })
    }

    return str
}

export default { locale, format }
