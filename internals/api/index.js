const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const { connect } = require('mongoose')
const logger = require('../Logger')
const limiter = require('express-rate-limit')

const app = express()

connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })

app.set('trust proxy', 1)
app.disable('x-powered-by')

app.use(morgan('[API] – [:date[iso]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'))
app.use(express.json())
app.use(cors())
app.use(limiter({ windowMs: 600000, max: 50 }))

app.use('/webhooks/patreon', require('./webhooks/patreon'))

// app.all('/*', async (req, res, next) => {
//     const referer = req.headers['referer']
//     const hosts = ['https://voidlacuna.ru', 'https://www.voidlacuna.ru', 'https://discord.com']

//     if (!referer || !hosts.some(host => referer.includes(host))) {
//         await res.status(423).send('Locked')

//         return
//     }

//     await next()
// })

app.use('/guilds', require('./routes/guilds'))
app.use('/authorize', require('./routes/oauth2'))
app.use('/structure', require('./routes/structure'))
app.use('/users', require('./routes/users'))

app.all('/*', async (req, res) => await res.status(404).json({ status: 404, message: 'Not Found' }))

app.listen(process.env.SERVER_PORT, () => {
    logger.info(`(API): Service started on port ${process.env.SERVER_PORT}`)
    logger.telegram.info(`(API): Service started on port ${process.env.SERVER_PORT}`)
})