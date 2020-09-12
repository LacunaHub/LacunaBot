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