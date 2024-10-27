import koaCORS from '@koa/cors'
import { LavalunaManager } from '@lacunahub/lavaluna.js'
import { ServerClient } from '@lacunahub/letsfrag'
import Koa from 'koa'
import koaBody from 'koa-body'
import koaJSON from 'koa-json'
import koaLogger from 'koa-logger'
import database from '../database'
import Logger from '../internals/Logger'
import ReleaseNotesLogger from './modules/ReleaseNotesLogger'
import ReportsChecker from './modules/ReportsChecker'
import Statistics from './modules/Statistics'
import { handleDiamondGuilds } from './modules/billing/utility/DiamondGuild'
import { handlePatrons } from './modules/billing/utility/Patron'
import YouTubeAlerts from './modules/social-alerts/YouTubeAlerts'
import routes from './routes'
import { passKnownReferrers } from './utility/Utils'

const app = new Koa()
const serverClient = new ServerClient(null, {
    host: process.env.LCN_SERVER_HOST,
    port: +process.env.LCN_SERVER_PORT,
    authorization: process.env.LCN_SERVER_AUTHORIZATION,
    type: 'api'
})
const lava = new LavalunaManager({
    nodes: process.env.LCN_LAVALINK_NODES.split(',').map(v => {
        const [name, hostname, port, password] = v.split(':')

        return {
            name,
            hostname,
            port: +port,
            secure: +port === 443,
            password,
            reconnectRetryAmount: 100,
            reconnectRetryDelay: 60000
        }
    }),
    clientId: process.env.LCN_DISCORD_CLIENT_ID,
    send: () => {}
})

app.use(koaBody({ jsonLimit: '50mb' }))
app.use(koaJSON())
app.use(koaCORS({ credentials: true, exposeHeaders: ['Content-Disposition'] }))
app.use(
    koaLogger({
        transporter: str => Logger.log(str)
    })
)

app.proxy = process.env.LCN_ROOT_DOMAIN !== 'localhost'
app.keys = ['discord_oauth_state']

app.use(async (ctx, next) => {
    try {
        await next()
    } catch (err) {
        ctx.status = err.status || 500
        ctx.body = { code: err.code || 1, message: err.message || 'Unknown error' }

        ctx.app.emit('error', err, ctx)
    }
}).use(passKnownReferrers)

app.use(routes.auth.routes()).use(routes.auth.allowedMethods())
app.use(routes.authorize.routes()).use(routes.authorize.allowedMethods())
app.use(routes.common.routes()).use(routes.common.allowedMethods())
app.use(routes.guilds.routes()).use(routes.guilds.allowedMethods())
app.use(routes.billing.routes()).use(routes.billing.allowedMethods())
app.use(routes.state.routes()).use(routes.state.allowedMethods())
app.use(routes.users.routes()).use(routes.users.allowedMethods())
app.use(routes.webhooks.routes()).use(routes.webhooks.allowedMethods())

database.connect()
serverClient.connect()
lava.initialize()

app.listen(process.env.LCN_API_PORT, () => {
    Logger.info(`API started on port ${process.env.LCN_API_PORT}`)

    handleDiamondGuilds()
    handlePatrons()
    Statistics.createCollectionSchedule()
    YouTubeAlerts.createRefreshmentSchedule()
    ReleaseNotesLogger.createSchedule()
    ReportsChecker.createSchedule()
})

process.on('uncaughtException', Logger.error)
process.on('unhandledRejection', Logger.error)

export { app, lava, serverClient }
