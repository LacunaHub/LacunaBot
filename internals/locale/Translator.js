class Translator {
    /**
     * Выбирает указанную локализацию
     * 
     * @param {String} locale
     */
    static locale(locale) {
        let file

        switch (locale) {
            case 'ru':
                file = require('./languages/russian.json')
            break
        
            case 'en':
                file = require('./languages/english.json')
            break
        }

        return file
    }

    /**
     * Заменяет все выделенные места в строке указанными параметрами по порядку
     * 
     * @param {String} str
     * @param  {...any} args
     */
    static format(str, ...args) {
        const patterns = str.match(/{\d+}/g) || []

        for (const pattern of patterns) {
            const i = patterns.indexOf(pattern)

            str = str.replace(pattern, args[i])
        }

        return str
    }
}

module.exports = Translator