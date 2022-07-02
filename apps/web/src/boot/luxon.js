import { DateTime, Settings } from 'luxon'
import { boot } from 'quasar/wrappers'

export default boot(({ app }) => {
    Settings.defaultLocale = 'ru'
    app.config.globalProperties.$dt = DateTime
})

export { DateTime }
