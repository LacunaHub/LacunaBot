import numbro from 'numbro'
import { boot } from 'quasar/wrappers'

export default boot(({ app }) => {
    app.config.globalProperties.$numbro = numbro
})

export { numbro }
