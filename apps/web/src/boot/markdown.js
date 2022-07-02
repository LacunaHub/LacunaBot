import { toHTML } from 'discord-markdown'
import { boot } from 'quasar/wrappers'

export default boot(({ app }) => {
    app.config.globalProperties.$markdown = toHTML
})

export { toHTML }
