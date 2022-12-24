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

const isMasterBridge = process.env.DISCORD_CLIENT_BRIDGE_HOST === 'localhost'

import { Bridge } from 'discord-cross-hosting'
import { Server } from 'http'
import api from './internals/api'
import { bridgeClient, clusterManager } from './internals/Cluster'
import logger from './internals/Logger'
import { handleDiamondGuilds } from './internals/structures/DiamondGuild'
import { handlePatrons } from './internals/structures/Patron'
import { syncBills as syncQiwiBills } from './internals/utility/Qiwi'
import { scheduleStatsCollect } from './internals/utility/Statistics'
import { hubRefreshSubscriptions } from './modules/YouTube'

let bridge: Bridge, server: Server

if (isMasterBridge) {
    server = api.listen(process.env.API_PORT, () => {
        logger.log(`[API] Server started on port ${process.env.API_PORT} with proxy state ${api.proxy}`)
        logger.telegram.log(`[API] Server started on port ${process.env.API_PORT} with proxy state ${api.proxy}`)
    })

    bridge = new Bridge({
        token: process.env.DISCORD_CLIENT_TOKEN,
        authToken: process.env.DISCORD_CLIENT_BRIDGE_AUTH_TOKEN,
        totalShards: Number(process.env.DISCORD_CLIENT_TOTAL_SHARDS),
        totalMachines: Number(process.env.DISCORD_CLIENT_TOTAL_MACHINES),
        port: Number(process.env.DISCORD_CLIENT_BRIDGE_PORT)
    })

    bridge.on('ready', url => {
        logger.info(`[Bridge] Bridge is ready on url ${url}`)

        startServices()
    })

    bridge.on('connect', client => logger.info(`[Bridge] Client "${(client as any).id}" connected`))
    bridge.on('disconnect', client => logger.warn(`[Bridge] Client "${(client as any).id}" disconnected`))

    bridge.start()
} else {
    startServices()
}

async function startServices() {
    await bridgeClient.connect()
    await clusterManager.spawn({ timeout: -1 })
    bridgeClient.listen(clusterManager)

    scheduleStatsCollect()
    syncQiwiBills()
    handleDiamondGuilds()
    handlePatrons()
    hubRefreshSubscriptions()
}

export default { server, bridge }
