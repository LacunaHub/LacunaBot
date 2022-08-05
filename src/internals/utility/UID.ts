export function generateSimpleId(length: number = 4) {
    if (typeof length !== 'number') length = 4
    if (length < 4) length = 4
    if (length > 11) length = 11

    return `${Math.random().toString(36).substring(2, length).toUpperCase()}`
}
