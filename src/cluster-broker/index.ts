import Logger from '@/utility/Logger'
import { Server } from '@lacunahub/letsfrag'

const logger = Logger.child({ app: 'cluster-broker' })

const server = new Server({
    authorization: process.env.LCN_SERVER_AUTHORIZATION,
    hostCount: Number(process.env.LCN_SERVER_HOST_COUNT),
    shardCount: Number(process.env.LCN_SERVER_SHARD_COUNT),
    port: Number(process.env.LCN_SERVER_PORT),
    botToken: process.env.LCN_DISCORD_CLIENT_TOKEN
})

server.on('connect', connection => logger.info({ connectionId: connection.id }, 'new connection'))
server.on('disconnect', (connection, reason) => logger.info({ connectionId: connection.id, reason }, 'disconnection'))
server.on('error', (err, connection) => logger.error({ connectionId: connection.id, err }, 'error event'))
server.on('message', (message, connection) => logger.info({ connectionId: connection.id, message }, 'message event'))
server.on('ready', address => logger.info({ address }, 'broker ready'))
server.on('request', (message, _, connection) => logger.info({ connectionId: connection.id, message }, 'request'))

process.on('uncaughtException', logger.error)
process.on('unhandledRejection', logger.error)

server.initialize()
