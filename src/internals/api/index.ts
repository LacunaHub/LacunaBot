import koaCors from '@koa/cors'
import Koa from 'koa'
import koaBody from 'koa-body'
import koaJson from 'koa-json'
import koaMorgan from 'koa-morgan'
import { connect } from 'mongoose'
import { QuickDB } from 'quick.db'
import database from '../../database'
import authorize from './routes/authorize'
import guilds from './routes/guilds'
import payments from './routes/payments'
import state from './routes/state'
import subscriptions from './routes/subscriptions'
import users from './routes/users'
import { passKnownReferrers } from './utility/Authorize'

const app: Koa = new Koa()

connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
database.mysql.connect().then(() => {
    database.qdb = new QuickDB({ driver: database.mysql })
})

app.use(koaBody({ jsonLimit: '50mb' }))
app.use(koaJson())
app.use(
    koaMorgan('[API: :date[iso]] – :req[x-forwarded-for] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"', {
        skip: req => req.method == 'OPTIONS'
    })
)
app.use(koaCors({ credentials: true }))

app.proxy = process.env.WEBSITE_DOMAIN !== 'localhost'
app.keys = ['discord_oauth_state']

app.use(passKnownReferrers)

app.use(authorize.routes()).use(authorize.allowedMethods())
app.use(guilds.routes()).use(guilds.allowedMethods())
app.use(payments.routes()).use(payments.allowedMethods())
app.use(state.routes()).use(state.allowedMethods())
app.use(subscriptions.routes()).use(subscriptions.allowedMethods())
app.use(users.routes()).use(users.allowedMethods())

export default app
