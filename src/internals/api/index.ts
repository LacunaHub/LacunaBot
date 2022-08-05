import koaCors from '@koa/cors'
import Koa from 'koa'
import koaBodyParser from 'koa-bodyparser'
import koaJson from 'koa-json'
import koaMorgan from 'koa-morgan'
import rateLimit from 'koa-ratelimit'
import { connect } from 'mongoose'
import authorize from './routes/authorize'
import guilds from './routes/guilds'
import payments from './routes/payments'
import state from './routes/state'
import subscriptions from './routes/subscriptions'
import users from './routes/users'
import { passKnownReferrers } from './utility/Authorize'

const app: Koa = new Koa()

connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })

app.use(koaBodyParser())
app.use(koaJson())
app.use(
    koaMorgan('[API: :date[iso]] – :req[x-forwarded-for] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"', {
        skip: req => req.method == 'OPTIONS'
    })
)
app.use(koaCors({ credentials: true }))

app.proxy = process.env.WEBSITE_DOMAIN != 'localhost'

app.use(passKnownReferrers)

app.use(
    rateLimit({
        driver: 'memory',
        db: new Map(),
        duration: 300000,
        max: 50,
        errorMessage: 'Rate Limit Reached',
        id: ctx => (ctx.request.headers['x-forwarded-for'] as string) || ctx.ip
    })
)

app.use(authorize.routes()).use(authorize.allowedMethods())
app.use(guilds.routes()).use(guilds.allowedMethods())
app.use(payments.routes()).use(payments.allowedMethods())
app.use(state.routes()).use(state.allowedMethods())
app.use(subscriptions.routes()).use(subscriptions.allowedMethods())
app.use(users.routes()).use(users.allowedMethods())

export default app
