import { TextBasedChannel } from 'discord.js'
import { Context } from 'koa'
import { lava, serverClient } from '../../..'
import Lacuna from '../../../../internals/Lacuna'
import {
    BotMetrics,
    channelCounter,
    commandUsageCounter,
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
    const stats = await serverClient.broadcastEval<BotMetrics[][]>((self: Lacuna) => {
        const channels = self.channels.cache,
            textChannels = channels.filter(v => v.type === 0),
            voiceChannels = channels.filter(v => v.type === 2),
            categoryChannels = channels.filter(v => v.type === 4),
            announcementChannels = channels.filter(v => v.type === 5),
            stageChannels = channels.filter(v => v.type === 13),
            forumChannels = channels.filter(v => v.type === 15)
        const emojis = self.emojis.cache,
            animatedEmojis = emojis.filter(v => v.animated)
        const guilds = self.guilds.cache,
            largeGuilds = guilds.filter(v => v.memberCount >= 1500),
            partneredGuilds = guilds.filter(v => v.partnered),
            verifiedGuilds = guilds.filter(v => v.verified),
            boostedGuilds = guilds.filter(v => v.premiumTier),
            unavailableGuilds = guilds.filter(v => !v.available)
        const messageCount = channels.filter(v => v.isTextBased()).reduce((x, y: TextBasedChannel) => (x += y.messages.cache.size), 0)
        const voiceConnectionCount = guilds.reduce((x, y) => (x += y.voiceStates.cache.size), 0)

        return {
            hostname: self.hostname,
            clusterId: self.cluster.id,
            channelCount: channels.size,
            textChannelCount: textChannels.size,
            voiceChannelCount: voiceChannels.size,
            categoryChannelCount: categoryChannels.size,
            announcementChannelCount: announcementChannels.size,
            stageChannelCount: stageChannels.size,
            forumChannelCount: forumChannels.size,
            emojiCount: emojis.size,
            animatedEmojiCount: animatedEmojis.size,
            guildCount: guilds.size,
            largeGuildCount: largeGuilds.size,
            partneredGuildCount: partneredGuilds.size,
            verifiedGuildCount: verifiedGuilds.size,
            boostedGuildCount: boostedGuilds.size,
            unavailableGuildCount: unavailableGuilds.size,
            userCount: guilds.reduce((x, y) => (x += y.memberCount), 0),
            cachedUserCount: self.users.cache.size,
            messageCount: messageCount,
            voiceConnectionCount: voiceConnectionCount,
            wsPing: self.ws.ping,
            wsStatus: self.ws.status,
            commandUsageCount: self.commands.map(v => ({ name: v.name, uses: v.uses }))
        }
    })
    const flatStats = stats.flat().sort((x, y) => x.clusterId - y.clusterId)
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

    channelCounter.set(flatStats.reduce((x, y) => (x += y.channelCount), 0) || 0)
    channelCounter.set({ label: 'Text' }, flatStats.reduce((x, y) => (x += y.textChannelCount), 0) || 0)
    channelCounter.set({ label: 'Voice' }, flatStats.reduce((x, y) => (x += y.voiceChannelCount), 0) || 0)
    channelCounter.set({ label: 'Category' }, flatStats.reduce((x, y) => (x += y.categoryChannelCount), 0) || 0)
    channelCounter.set({ label: 'Announcement' }, flatStats.reduce((x, y) => (x += y.announcementChannelCount), 0) || 0)
    channelCounter.set({ label: 'Stage' }, flatStats.reduce((x, y) => (x += y.stageChannelCount), 0) || 0)
    channelCounter.set({ label: 'Forum' }, flatStats.reduce((x, y) => (x += y.forumChannelCount), 0) || 0)

    emojiCounter.set(flatStats.reduce((x, y) => (x += y.emojiCount), 0) || 0)
    emojiCounter.set({ label: 'Animated' }, flatStats.reduce((x, y) => (x += y.animatedEmojiCount), 0) || 0)

    guildCounter.set(flatStats.reduce((x, y) => (x += y.guildCount), 0) || 0)
    guildCounter.set({ label: 'Large' }, flatStats.reduce((x, y) => (x += y.largeGuildCount), 0) || 0)
    guildCounter.set({ label: 'Partnered' }, flatStats.reduce((x, y) => (x += y.partneredGuildCount), 0) || 0)
    guildCounter.set({ label: 'Verified' }, flatStats.reduce((x, y) => (x += y.verifiedGuildCount), 0) || 0)
    guildCounter.set({ label: 'Boosted' }, flatStats.reduce((x, y) => (x += y.boostedGuildCount), 0) || 0)
    guildCounter.set({ label: 'Unavailable' }, flatStats.reduce((x, y) => (x += y.unavailableGuildCount), 0) || 0)

    userCounter.set(flatStats.reduce((x, y) => (x += y.userCount), 0) || 0)
    userCounter.set({ label: 'Cached' }, flatStats.reduce((x, y) => (x += y.cachedUserCount), 0) || 0)

    messageCounter.set(flatStats.reduce((x, y) => (x += y.messageCount), 0) || 0)

    voiceConnectionCounter.set(flatStats.reduce((x, y) => (x += y.voiceConnectionCount), 0) || 0)

    for (const cluster of flatStats) {
        channelCounter.set({ shard: cluster.clusterId }, cluster.channelCount || 0)
        channelCounter.set({ shard: cluster.clusterId, label: 'Text' }, cluster.textChannelCount || 0)
        channelCounter.set({ shard: cluster.clusterId, label: 'Voice' }, cluster.voiceChannelCount || 0)
        channelCounter.set({ shard: cluster.clusterId, label: 'Category' }, cluster.categoryChannelCount || 0)
        channelCounter.set({ shard: cluster.clusterId, label: 'Announcement' }, cluster.announcementChannelCount || 0)
        channelCounter.set({ shard: cluster.clusterId, label: 'Stage' }, cluster.stageChannelCount || 0)
        channelCounter.set({ shard: cluster.clusterId, label: 'Forum' }, cluster.forumChannelCount || 0)

        emojiCounter.set({ shard: cluster.clusterId }, cluster.emojiCount || 0)
        emojiCounter.set({ shard: cluster.clusterId, label: 'Animated' }, cluster.animatedEmojiCount || 0)

        guildCounter.set({ shard: cluster.clusterId }, cluster.guildCount || 0)
        guildCounter.set({ shard: cluster.clusterId, label: 'Large' }, cluster.largeGuildCount || 0)
        guildCounter.set({ shard: cluster.clusterId, label: 'Partnered' }, cluster.partneredGuildCount || 0)
        guildCounter.set({ shard: cluster.clusterId, label: 'Verified' }, cluster.verifiedGuildCount || 0)
        guildCounter.set({ shard: cluster.clusterId, label: 'Boosted' }, cluster.boostedGuildCount || 0)
        guildCounter.set({ shard: cluster.clusterId, label: 'Unavailable' }, cluster.unavailableGuildCount || 0)

        userCounter.set({ shard: cluster.clusterId }, cluster.userCount || 0)
        userCounter.set({ shard: cluster.clusterId, label: 'Cached' }, cluster.cachedUserCount || 0)

        messageCounter.set({ shard: cluster.clusterId }, cluster.messageCount || 0)

        voiceConnectionCounter.set({ shard: cluster.clusterId }, cluster.voiceConnectionCount || 0)

        wsPingGauge.set({ hostname: cluster.hostname, shard: cluster.clusterId }, cluster.wsPing)
        wsStatusGauge.set({ hostname: cluster.hostname, shard: cluster.clusterId }, cluster.wsStatus)

        const commandUsageCount: Record<string, number> = flatStats
            .flatMap(v => v.commandUsageCount)
            .reduce((x, y) => {
                x[y.name] = x[y.name] ? x[y.name] + y.uses : y.uses
                return x
            }, {})

        for (const key in commandUsageCount) {
            commandUsageCounter.set({ command: key }, commandUsageCount[key])
        }
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
