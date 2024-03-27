import koaCors from '@koa/cors'
import { ServerClient } from '@lacunahub/letsfrag'
import Koa from 'koa'
import koaBody from 'koa-body'
import koaJson from 'koa-json'
import koaMorgan from 'koa-morgan'
import database from '../../database'
import Logger from '../Logger'
import { handleDiamondGuilds } from '../structures/DiamondGuild'
import { handlePatrons } from '../structures/Patron'
import { syncBills as syncQiwiBills } from '../utility/billing/providers/QIWI'
import authorize from './routes/authorize'
import common from './routes/common'
import guilds from './routes/guilds'
import payments from './routes/payments'
import state from './routes/state'
import subscriptions from './routes/subscriptions'
import users from './routes/users'
import { passKnownReferrers } from './utility/Authorize'
import ReleaseNotesLogger from './utility/ReleaseNotesLogger'

const app: Koa = new Koa()
const bridgeClient = new ServerClient(null, {
    host: process.env.LCN_SERVER_HOST,
    port: Number(process.env.LCN_SERVER_PORT),
    authorization: process.env.LCN_SERVER_AUTHORIZATION
})

app.use(koaBody({ jsonLimit: '50mb' }))
app.use(koaJson())
app.use(
    koaMorgan('[LOG: :date[iso]] – :req[x-forwarded-for] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"', {
        skip: req => req.method == 'OPTIONS'
    })
)
app.use(koaCors({ credentials: true, exposeHeaders: ['Content-Disposition'] }))

app.proxy = process.env.LCN_WEBSITE_DOMAIN !== 'localhost'
app.keys = ['discord_oauth_state']

app.use(async (ctx, next) => {
    try {
        await next()
    } catch (err) {
        ctx.status = err.status || 500
        ctx.body = { code: err.code || 1, message: err.message || 'Unknown error' }

        ctx.app.emit('error', err, ctx)
    }
})

app.use(passKnownReferrers)

app.use(authorize.routes()).use(authorize.allowedMethods())
app.use(common.routes()).use(common.allowedMethods())
app.use(guilds.routes()).use(guilds.allowedMethods())
app.use(payments.routes()).use(payments.allowedMethods())
app.use(state.routes()).use(state.allowedMethods())
app.use(subscriptions.routes()).use(subscriptions.allowedMethods())
app.use(users.routes()).use(users.allowedMethods())

database.connect()
bridgeClient.connect()

app.listen(process.env.LCN_API_PORT, () => {
    Logger.log(`[API] Server started on port ${process.env.LCN_API_PORT} with proxy state ${app.proxy}`)
    Logger.telegram.log(`[API] Server started on port ${process.env.LCN_API_PORT} with proxy state ${app.proxy}`)

    syncQiwiBills()
    handleDiamondGuilds()
    handlePatrons()
    ReleaseNotesLogger.createSchedule()
})

process.on('uncaughtException', Logger.error)
process.on('unhandledRejection', Logger.error)

export { app, bridgeClient }
