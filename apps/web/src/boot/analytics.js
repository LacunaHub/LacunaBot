import { boot } from 'quasar/wrappers'
import { createGtag } from 'vue-gtag'

export default boot(({ app, router }) => {
    const gtag = createGtag({
        property: {
            id: process.env.GTAG
        },
        appName: 'Lacuna',
        pageTracker: {
            router,
            useScreenview: true
        }
    })

    app.use(gtag, router)
})
