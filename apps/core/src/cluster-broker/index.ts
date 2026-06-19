import Logger from '@/utility/Logger.js'
import { ClusterBroker } from '@lacunahub/letsfrag'

const logger = Logger.child({ app: 'cluster-broker' })

const clusterBroker = new ClusterBroker({
    redisURI: process.env.LCN_REDIS_URI!,
    botToken: process.env.LCN_DISCORD_CLIENT_TOKEN!
})

clusterBroker.on('error', err => logger.error({ err }, 'cluster broker error'))
// clusterBroker.on('debug', (message, args) => logger.debug({ args }, message))
clusterBroker.on('ready', () => logger.info('cluster broker ready'))
clusterBroker.on('disconnect', () => logger.info('cluster broker disconnection'))
clusterBroker.on('clientConnect', client => logger.info({ id: client.id }, 'client connection'))
clusterBroker.on('clientDisconnect', client => logger.info({ id: client.id }, 'client disconnection'))
clusterBroker.on('managerCreate', manager => logger.info({ id: manager.id }, 'manager creation'))
clusterBroker.on('managerRemove', manager => logger.info({ id: manager.id }, 'manager removal'))
clusterBroker.on('managerReady', manager => logger.info({ id: manager.id }, 'manager ready'))
clusterBroker.on('managerHeartbeat', (manager, beatsGap) =>
    logger.info({ id: manager.id, beatsGap }, 'manager heartbeat')
)
clusterBroker.on('managerShardsAssign', (manager, shards) =>
    logger.info({ id: manager.id, shards }, 'manager shard assignment')
)
clusterBroker.on('managerUnhealthy', manager => logger.warn({ id: manager.id }, 'unhealthy manager'))

process.on('uncaughtException', logger.error.bind(logger))
process.on('unhandledRejection', logger.error.bind(logger))

clusterBroker.initialize()
