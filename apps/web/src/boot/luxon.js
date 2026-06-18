import { DateTime, Settings } from 'luxon'
import { boot } from 'quasar/wrappers'
import { getLocale } from 'src/utils/Utils'

export default boot(({ app }) => {
    Settings.defaultLocale = getLocale()
    app.config.globalProperties.$dt = DateTime
})

export { DateTime }
