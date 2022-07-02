import VueGtag from 'vue-gtag'
import { boot } from 'quasar/wrappers'

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
