import { Server } from '@lacunahub/letsfrag'
import logger from './internals/Logger'

const server = new Server({
    authorization: process.env.LCN_SERVER_AUTHORIZATION,
    hostCount: Number(process.env.LCN_SERVER_HOST_COUNT),
    shardCount: Number(process.env.LCN_SERVER_SHARD_COUNT),
    port: Number(process.env.LCN_SERVER_PORT),
    botToken: process.env.LCN_DISCORD_CLIENT_TOKEN
})

server.on('connect', client => logger.info(`[Bridge] Client "${client.id}" connected`))
server.on('disconnect', client => logger.warn(`[Bridge] Client "${client.id}" disconnected`))
server.on('ready', url => logger.info(`[Bridge] Bridge is ready on url ${url}`))

server.initialize()

process.on('uncaughtException', logger.error)
process.on('unhandledRejection', logger.error)
