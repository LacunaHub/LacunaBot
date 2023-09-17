import { Client as BridgeClient } from 'discord-cross-hosting'
import { ClusterManager, HeartbeatManager } from 'discord-hybrid-sharding'
import { cpu, mem, os } from 'node-os-utils'
import logger from './Logger'

const bridgeClient = new BridgeClient({
    host: process.env.DISCORD_CLIENT_BRIDGE_HOST,
    port: Number(process.env.DISCORD_CLIENT_BRIDGE_PORT),
    authToken: process.env.DISCORD_CLIENT_BRIDGE_AUTH_TOKEN,
    agent: 'bot',
    retries: 360,
    rollingRestarts: false
})

bridgeClient.on('ready', () => logger.info('[BridgeClient] Client is ready'))
bridgeClient.on('bridgeRequest', async message => {
    if (!message._sCustom && !message._sRequest) return false

    if ((message as any).type === 'server-performance') {
        await message.reply({
            hostname: os.hostname(),
            uptime: os.uptime(),
            cpuUsage: await cpu.usage(),
            memoryUsed: await mem.used(),
            clusterList: clusterManager.clusterList
        })
    }
})

const clusterManager = new ClusterManager(`${__dirname}/Client.js`, {
    restarts: {
        max: 1,
        interval: 30 * 60 * 1000
    },
    mode: 'process',
    respawn: true
})

clusterManager.extend(
    new HeartbeatManager({
        interval: 2000,
        maxMissedHeartbeats: 10
    })
)

clusterManager.on('clusterCreate', cluster => logger.info(`[ClusterManager] Cluster #${cluster.id} has been created`))

export { bridgeClient, clusterManager }
