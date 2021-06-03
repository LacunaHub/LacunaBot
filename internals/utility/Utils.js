class Utils {
    /**
     * Обрезает массив, если он превышает допустимое количество
     * 
     * @param {Any[]} array
     * @param {Number} [limit]
     * @param {String} [separator]
     */
    static TruncateArray(array, limit = 15, separator = '\n') {
        if (!array || !Array.isArray(array)) throw new TypeError('Argument not provided or isn\'t string')

        if (array.length > limit) {
            const length = array.length - limit

            array = array.slice(0, limit)
            array.push(`${length} ...`)
        }
    
        return array.join(separator)
    }


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

    static isSnowflake(str) {
        return /\d{17,19}/.test(str)
    }

    /**
     * 
     * @param {string} string
     */
    static splitStringCase(string) {
        const upper = [], lower = []

        string = string.replace(/([^a-zа-яё]+)/gi, '')

        for (let i = 0; i < string.length; i++) {
            if (string.charAt(i) === string.charAt(i).toUpperCase()) {
                upper.push(string.charAt(i))
            }

            else if (string.charAt(i) === string.charAt(i).toLowerCase()) {
                lower.push(string.charAt(i))
            }
        }

        return { upper, lower, length: string.length }
    }
}

module.exports = Utils