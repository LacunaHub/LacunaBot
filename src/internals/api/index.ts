import { configureEnvironments } from '../utility/Utils'

configureEnvironments()

import koaCors from '@koa/cors'
import { Client as BridgeClient } from 'discord-cross-hosting'
import Koa from 'koa'
import koaBody from 'koa-body'
import koaJson from 'koa-json'
import koaMorgan from 'koa-morgan'
import { connect } from 'mongoose'
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

const app: Koa = new Koa()
const bridgeClient = new BridgeClient({
    host: process.env.DISCORD_CLIENT_BRIDGE_HOST,
    port: Number(process.env.DISCORD_CLIENT_BRIDGE_PORT),
    authToken: process.env.DISCORD_CLIENT_BRIDGE_AUTH_TOKEN,
    agent: 'api'
})

app.use(koaBody({ jsonLimit: '50mb' }))
app.use(koaJson())
app.use(
    koaMorgan('[LOG: :date[iso]] – :req[x-forwarded-for] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"', {
        skip: req => req.method == 'OPTIONS'
    })
)
app.use(koaCors({ credentials: true, exposeHeaders: ['Content-Disposition'] }))

app.proxy = process.env.WEBSITE_DOMAIN !== 'localhost'
app.keys = ['discord_oauth_state']

app.use(passKnownReferrers)

app.use(authorize.routes()).use(authorize.allowedMethods())
app.use(common.routes()).use(common.allowedMethods())
app.use(guilds.routes()).use(guilds.allowedMethods())
app.use(payments.routes()).use(payments.allowedMethods())
app.use(state.routes()).use(state.allowedMethods())
app.use(subscriptions.routes()).use(subscriptions.allowedMethods())
app.use(users.routes()).use(users.allowedMethods())

connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
database.qdb.connect()

bridgeClient.connect()
app.listen(process.env.API_PORT, () => {
    Logger.log(`[API] Server started on port ${process.env.API_PORT} with proxy state ${app.proxy}`)
    Logger.telegram.log(`[API] Server started on port ${process.env.API_PORT} with proxy state ${app.proxy}`)

    syncQiwiBills()
    handleDiamondGuilds()
    handlePatrons()
})

process.on('uncaughtException', Logger.error)
process.on('unhandledRejection', Logger.error)

export { app, bridgeClient }
