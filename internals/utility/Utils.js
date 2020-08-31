class Utils {
    /**
     * Обрезает строку, если она превышает допустимое количество символов
     * 
     * @param {String} string
     * @param {Number} [limit]
     * @param {String} [end]
     */
    static TruncateString(string, limit = 100, end = '...') {
        if (typeof string !== 'string') throw new TypeError('Argument not provided or isn\'t string')

        if (typeof limit !== 'number') limit = 100
        if (typeof end !== 'string') end = '...'

        if (string.length > limit)
           return string.substring(0, limit) + end
        else
           return string
    }

    /**
     * Находит Snowflake в строке
     * 
     * @param {String} string
     */
    static ParseSnowflake(string) {
        const match = string.match(/[0-9]{17,20}/i)

        return match ? match.toString() : null
    }

    /**
     * Перемешивает элементы массива
     * 
     * @param {Any[]} array
     */
    static ShuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            [array[i], array[j]] = [array[j], array[i]]
        }

        return array
    }
}

module.exports = Utils