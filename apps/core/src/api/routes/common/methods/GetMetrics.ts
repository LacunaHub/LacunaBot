import { brokerClient, lava } from '@/api/utility/Managers'
import { indexToLetter } from '@/internals/utility/Utils'
import { BrokerMessageDataMap, BrokerMessageType } from '@lacunahub/letsfrag'
import { Context } from 'koa'
import {
    channelCounter,
    emojiCounter,
    guildCounter,
    lavaNodeLoadGauge,
    lavaNodePlayersCounter,
    lavaNodePlayingPlayersCounter,
    messageCounter,
    register,
    userCounter,
    voiceConnectionCounter,
    wsPingGauge,
    wsStatusGauge
} from '../../../modules/Metrics'

export default async function getMetrics(ctx: Context) {
    let stats: BrokerMessageDataMap[BrokerMessageType.RequestStatsResult] = {
        readyAt: null,
        clients: [],
        managers: [],
        shardCount: 0,
        shardsPerManager: 0
    }
    const lavaNodes = [...lava.nodes.cache.values()].map(v => {
        return {
            id: v.options.name,
            cpu_load: v.stats.cpu.lavalinkLoad,
            players: {
                playing: v.stats.playingPlayers,
                total: v.stats.players
            }
        }
    })

    try {
        stats = await brokerClient.request({ type: BrokerMessageType.RequestStats })
    } catch (err) {}

    const clusters = stats.managers.flatMap((v, i) => {
        const host = indexToLetter(i).toUpperCase()
        return v.clusters.map(vv => ({ ...vv, host }))
    })

    channelCounter.set(clusters.reduce((x, y) => (x += y.channelCount), 0) || 0)
    emojiCounter.set(clusters.reduce((x, y) => (x += y.emojiCount), 0) || 0)
    guildCounter.set(clusters.reduce((x, y) => (x += y.guildCount), 0) || 0)
    userCounter.set(clusters.reduce((x, y) => (x += y.userCount), 0) || 0)
    messageCounter.set(clusters.reduce((x, y) => (x += y.messageCount), 0) || 0)
    voiceConnectionCounter.set(clusters.reduce((x, y) => (x += y.voiceConnectionCount), 0) || 0)

    for (const cluster of clusters) {
        channelCounter.set({ shard: cluster.id }, cluster.channelCount || 0)
        emojiCounter.set({ shard: cluster.id }, cluster.emojiCount || 0)
        guildCounter.set({ shard: cluster.id }, cluster.guildCount || 0)
        userCounter.set({ shard: cluster.id }, cluster.userCount || 0)
        messageCounter.set({ shard: cluster.id }, cluster.messageCount || 0)
        voiceConnectionCounter.set({ shard: cluster.id }, cluster.voiceConnectionCount || 0)
        wsPingGauge.set({ identifier: cluster.host, shard: cluster.id }, cluster.wsPing)
        wsStatusGauge.set({ identifier: cluster.host, shard: cluster.id }, cluster.wsStatus)
    }

    for (const node of lavaNodes) {
        lavaNodeLoadGauge.set({ node: node.id }, node.cpu_load)
        lavaNodePlayersCounter.set({ node: node.id }, node.players.total)
        lavaNodePlayingPlayersCounter.set({ node: node.id }, node.players.playing)
    }

    ctx.status = 200
    ctx.set('Content-Type', 'text/plain')
    ctx.body = await register.metrics()
}
