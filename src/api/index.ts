import koaCORS from '@koa/cors'
import Koa from 'koa'
import koaBody from 'koa-body'
import koaJSON from 'koa-json'
import koaPinoLogger from 'koa-pino-logger'
import database from '../database'
import { scheduleUpdateListingStats } from './modules/Metrics'
import ReleaseNotesLogger from './modules/ReleaseNotesLogger'
import ReportsChecker from './modules/ReportsChecker'
import { handleDiamondGuilds } from './modules/billing/utility/DiamondGuild'
import { handlePatrons } from './modules/billing/utility/Patron'
import YouTubeAlerts from './modules/social-alerts/YouTubeAlerts'
import routes from './routes'
import Logger from './utility/Logger'
import { brokerClient, lava } from './utility/Managers'
import { passKnownReferrers } from './utility/Utils'

const app = new Koa()

app.use(koaBody({ jsonLimit: '50mb' }))
app.use(koaJSON())
app.use(koaCORS({ credentials: true, exposeHeaders: ['Content-Disposition'] }))
app.use(koaPinoLogger({ logger: Logger }))

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
brokerClient.connect()
lava.initialize()

app.listen(process.env.LCN_API_PORT, () => {
    Logger.info({ port: process.env.LCN_API_PORT }, 'api started')

    handleDiamondGuilds()
    handlePatrons()
    scheduleUpdateListingStats()
    YouTubeAlerts.createRefreshmentSchedule()
    ReleaseNotesLogger.createSchedule()
    ReportsChecker.createSchedule()
})

process.on('uncaughtException', Logger.error.bind(Logger))
process.on('unhandledRejection', Logger.error.bind(Logger))
