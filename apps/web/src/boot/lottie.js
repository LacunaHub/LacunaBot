import { defineElement } from '@lordicon/element'
import lottie from 'lottie-web'

import { boot } from 'quasar/wrappers'

export default boot(({ app }) => {
    defineElement(lottie.loadAnimation)
})
