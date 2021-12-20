import { config } from 'dotenv'
import logger from './internals/Logger'

config()

import ShardingManager from './internals/utility/ShardingManager'

export const sharding: ShardingManager = new ShardingManager('./dist/internals/utility/Client.js', { token: process.env.CLIENT_TOKEN, respawn: true })

sharding.spawn({ amount: Number(process.env.CLIENT_MAX_SHARDS), delay: 20000, timeout: 60000 })

sharding.on('shardCreate', shard => {
    logger.info(`(Sharding Manager): Launching shard #${shard.id}`)
    sharding.readiness.push(Date.now())
})

import api from './internals/api'
import { Server } from 'http'

export const server: Server = api.listen(process.env.SERVER_PORT, () => {
    logger.info(`(API): Server started on port ${process.env.SERVER_PORT} with proxy state ${api.proxy}`)
    logger.telegram.info(`(API): Server started on port ${process.env.SERVER_PORT} with proxy state ${api.proxy}`)
})

export default { sharding, server }