import lottie from 'lottie-web'
import { defineElement } from 'lord-icon-element'

import { boot } from 'quasar/wrappers'

export default boot(({ app }) => {
    defineElement(lottie.loadAnimation)
})
