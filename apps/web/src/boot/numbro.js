import numbro from 'numbro'
import localeDE from 'numbro/languages/de-DE'
import localeFR from 'numbro/languages/fr-FR'
import localePL from 'numbro/languages/pl-PL'
import localeRU from 'numbro/languages/ru-RU'
import localeUK from 'numbro/languages/uk-UA'
import { boot } from 'quasar/wrappers'
import { getLocale } from 'src/utils/Utils'

const localeEN = numbro.languageData('en-US')

for (const lang of [localeEN, localeRU, localeUK, localeFR, localeDE, localePL]) {
    lang.languageTag = lang.languageTag.split('-')[0]
    numbro.registerLanguage(lang)
}

export default boot(({ app }) => {
    numbro.setLanguage(getLocale(), 'en')
    app.config.globalProperties.$numbro = numbro
})

export { numbro }
