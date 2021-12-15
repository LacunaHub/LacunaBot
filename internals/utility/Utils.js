class Utils {
    /**
     * Обрезает массив, если он превышает допустимое количество
     * 
     * @param {Any[]} array
     * @param {Number} [limit]
     * @param {String} [separator]
     */
    static truncateArray(array, limit = 15, separator = '\n') {
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
    static truncateString(string, limit = 100, end = '...') {
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
    static parseSnowflake(string) {
        const match = string.match(/[0-9]{17,20}/i)

        return match ? match.toString() : null
    }

    /**
     * Перемешивает элементы массива
     * 
     * @param {Any[]} array
     */
    static shuffleArray(array) {
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
     * @param {string} string
     */
    static splitStringCase(string) {
        const upper = [], lower = []

        string = string.replace(/([^a-zа-яёй]+)/gi, '')

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

    /**
     * @param {string} string
     */
    static removeDiscordPatterns(string) {
        return string.replace(/<@!?\d+>/g, '').replace(/<@&\d+>/g, '').replace(/<#\d+>/g, '').replace(/<a?:.+:\d+>/g, '').replace(/\s{2,}/g, ' ').trim()
    }

    static resolveObjectPath(path, object) {
        return path.split('.').reduce((x, y) => {
            return x ? x[y] : null
        }, object)
    }

    static escapeRegEx(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }

    /**
     * @param {any[]} array
     * @param {number} length
     */
    static chunkArray(array, length) {
        const arr = []

        for (let i = 0; i < array.length; i += length) {
            arr.push(array.slice(i, i + length))
        }

        return arr
    }

    /**
     * @param {string} string
     */
    static parseCommandArguments(string) {
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

    /**
     * @param {any[]} keys
     */
    static createEnum(keys) {
        const obj = {}

        for (const [index, key] of keys.entries()) {
          if (key === null) continue

          obj[key] = index
          obj[index] = key
        }

        return obj
    }

    static dotNotateObject(obj, target, prefix) {
        target = target || {}, prefix = prefix || ''
      
        Object.keys(obj).forEach(function(key) {
            if (typeof(obj[key]) === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
                Utils.dotNotateObject(obj[key],target,prefix + key + '.')
            } else {
                return target[prefix + key] = obj[key]
            }
        })
      
        return target
    }

    static shadeColor(color, amount) {
        return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
    }
}

module.exports = Utils