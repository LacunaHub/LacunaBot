import { messages } from 'lacuna-locale'
import { boot } from 'quasar/wrappers'
import { getLocale } from 'src/utils/Utils'
import { createI18n } from 'vue-i18n'

export default boot(({ app }) => {
    const i18n = createI18n({
        legacy: false,
        locale: getLocale(),
        fallbackLocale: 'ru',
        globalInjection: true,
        messages,

        pluralRules: {
            ru: function (choice, choicesLength) {
                if (choice === 0) {
                    return 0
                }

                const teen = choice > 10 && choice < 20
                const endsWithOne = choice % 10 === 1
                if (!teen && endsWithOne) {
                    return 1
                }
                if (!teen && choice % 10 >= 2 && choice % 10 <= 4) {
                    return 2
                }

                return choicesLength < 4 ? 2 : 3
            }
        }
    })

    app.use(i18n)
})
