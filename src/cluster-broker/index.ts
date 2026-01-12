import Logger from '@/utility/Logger'
import { ClusterBroker } from '@lacunahub/letsfrag'

const logger = Logger.child({ app: 'cluster-broker' })

const clusterBroker = new ClusterBroker({
    redis: process.env.LCN_REDIS_URI,
    hostCount: Number(process.env.LCN_SERVER_HOST_COUNT),
    shardCount: Number(process.env.LCN_SERVER_SHARD_COUNT),
    botToken: process.env.LCN_DISCORD_CLIENT_TOKEN
})

clusterBroker.on('connect', connection => logger.info({ connectionId: connection.id }, 'new connection'))
clusterBroker.on('disconnect', (connection, reason) => logger.info({ connectionId: connection.id, reason }, 'disconnection'))
clusterBroker.on('error', err => logger.error({ err }, 'error event'))
clusterBroker.on('clientMessage', (connection, message) => logger.info({ connectionId: connection.id, message }, 'message event'))
clusterBroker.on('ready', () => logger.info('broker ready'))
clusterBroker.on('clientRequest', (connection, message) => logger.info({ connectionId: connection.id, message }, 'request'))

process.on('uncaughtException', logger.error.bind(logger))
process.on('unhandledRejection', logger.error.bind(logger))

clusterBroker.initialize()
