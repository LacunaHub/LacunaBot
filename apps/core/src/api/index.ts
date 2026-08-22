import koaCORS from '@koa/cors'
import Koa from 'koa'
import { koaBody } from 'koa-body'
import koaJSON from 'koa-json'
import koaPinoLogger from 'koa-pino-logger'
import database from '../database/index.js'
import ReportsChecker from './modules/ReportsChecker.js'
import YouTubeAlerts from './modules/social-alerts/YouTubeAlerts.js'
import routes from './routes/index.js'
import Logger from './utility/Logger.js'
import { brokerClient, lava } from './utility/Managers.js'
import { passKnownReferrers } from './utility/Utils.js'

const app = new Koa()

app.use(koaBody({ jsonLimit: '50mb' }))
app.use(koaJSON())
app.use(koaCORS({ credentials: true, exposeHeaders: ['Content-Disposition'] }))
app.use(koaPinoLogger({ logger: Logger as any }))

app.proxy = process.env.LCN_ROOT_DOMAIN !== 'localhost'
app.keys = ['discord_oauth_state']

app.use(async (ctx, next) => {
    try {
        await next()
    } catch (err) {
        const error = err as any
        ctx.status = error.status || 500
        ctx.body = { code: error.code || 1, message: error.message || 'Unknown error' }

        ctx.app.emit('error', err, ctx)
    }
}).use(passKnownReferrers)

app.use(routes.auth.routes()).use(routes.auth.allowedMethods())
app.use(routes.authorize.routes()).use(routes.authorize.allowedMethods())
app.use(routes.common.routes()).use(routes.common.allowedMethods())
app.use(routes.guilds.routes()).use(routes.guilds.allowedMethods())
app.use(routes.state.routes()).use(routes.state.allowedMethods())
app.use(routes.users.routes()).use(routes.users.allowedMethods())
app.use(routes.webhooks.routes()).use(routes.webhooks.allowedMethods())

database.connect()
brokerClient.connect()
lava.initialize()

// listen on all interfaces
// required inside a docker container
app.listen(Number(process.env.LCN_API_PORT), '0.0.0.0').on('listening', () => {
    Logger.info({ port: process.env.LCN_API_PORT }, 'api started')

    YouTubeAlerts.createRefreshmentSchedule()
    ReportsChecker.createSchedule()
})

process.on('uncaughtException', Logger.error.bind(Logger))
process.on('unhandledRejection', Logger.error.bind(Logger))
