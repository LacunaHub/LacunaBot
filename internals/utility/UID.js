const regex = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i

class UID {
    /**
     * Генерирует простой уникальный идентификатор
     * 
     * @param {Number} length
     */
    static simple(length = 4) {
        if (typeof length !== 'number') length = 4
        if (length < 4) length = 4
        if (length > 11) length = 11

        return `${Math.random().toString(36).substr(2, length).toUpperCase()}`
    }
}

module.exports = UID