import { boot } from 'quasar/wrappers'
import VueGtag from 'vue-gtag'

export default boot(({ app, router }) => {
    app.use(
        VueGtag,
        {
            appName: 'Lacuna',
            pageTrackerScreenviewEnabled: true,
            config: {
                id: process.env.GTAG
            }
        },
        router
    )
})

export { VueGtag }
