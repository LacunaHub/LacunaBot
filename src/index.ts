import { IPCMessageType, Server } from '@lacunahub/letsfrag'
import logger from './internals/Logger'

const server = new Server({
    authorization: process.env.LCN_SERVER_AUTHORIZATION,
    hostCount: Number(process.env.LCN_SERVER_HOST_COUNT),
    shardCount: Number(process.env.LCN_SERVER_SHARD_COUNT),
    port: Number(process.env.LCN_SERVER_PORT),
    botToken: process.env.LCN_DISCORD_CLIENT_TOKEN
})

server.on('connect', client => logger.info(`[Server] Client "${client.id}" connected`))
server.on('disconnect', client => logger.warn(`[Server] Client "${client.id}" disconnected`))
server.on('error', err => logger.error(`[Server]`, err))
server.on('message', (message, client) => logger.log(`[Server] Client "${client.id}" sent a message with type "${IPCMessageType[message.type]}"`))
server.on('ready', url => logger.info(`[Server] Server is ready on url ${url}`))
server.on('request', (message, _, client) =>
    logger.log(`[Server] Client "${client.id}" initiated a request with type "${IPCMessageType[message.type]}"`)
)

process.on('uncaughtException', logger.error)
process.on('unhandledRejection', logger.error)

server.initialize()
