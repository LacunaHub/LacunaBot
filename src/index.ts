// Set Environments
require('dotenv').config()
process.env.API_URL =
    process.env.NODE_ENV === 'development'
        ? `http://${process.env.WEBSITE_DOMAIN}:${process.env.API_PORT}`
        : `https://api.${process.env.WEBSITE_DOMAIN}`
process.env.WEBSITE_URL =
    process.env.NODE_ENV === 'development'
        ? `http://${process.env.WEBSITE_DOMAIN}:${process.env.WEBSITE_PORT}`
        : `https://www.${process.env.WEBSITE_DOMAIN}`
process.env.CLIENT_OAUTH2_REDIRECT_URI = `${process.env.API_URL}/authorize/callback`

import { Server } from 'http'
import api from './internals/api'
import logger from './internals/Logger'
import ShardingManager from './internals/utility/ShardingManager'

export const sharding: ShardingManager = new ShardingManager('./dist/internals/utility/Client.js', { token: process.env.CLIENT_TOKEN, respawn: true })

sharding.spawn({ amount: Number(process.env.CLIENT_MAX_SHARDS), delay: 20000, timeout: 60000 })

sharding.on('shardCreate', shard => {
    logger.log(`[Sharding] Shard #${shard.id} created`)
    sharding.readiness.push(Date.now())
})

export const server: Server = api.listen(process.env.API_PORT, () => {
    logger.log(`[API] Server started on port ${process.env.API_PORT} with proxy state ${api.proxy}`)
    logger.telegram.log(`[API] Server started on port ${process.env.API_PORT} with proxy state ${api.proxy}`)
})

export default { sharding, server }
