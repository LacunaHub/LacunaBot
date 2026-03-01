import { Gauge, Registry } from 'prom-client'

export const register = new Registry()

export const channelCounter = new Gauge({
    name: 'lcn_channel_counter',
    help: 'The total number of channels',
    registers: [register],
    labelNames: ['shard']
})

export const emojiCounter = new Gauge({
    name: 'lcn_emoji_counter',
    help: 'The total number of emojis',
    registers: [register],
    labelNames: ['shard']
})

export const guildCounter = new Gauge({
    name: 'lcn_guild_counter',
    help: 'The total number of guilds',
    registers: [register],
    labelNames: ['shard']
})

export const userCounter = new Gauge({
    name: 'lcn_user_counter',
    help: 'The total number of users',
    registers: [register],
    labelNames: ['shard']
})

export const messageCounter = new Gauge({
    name: 'lcn_message_counter',
    help: 'The total number of messages sent',
    registers: [register],
    labelNames: ['shard']
})

export const voiceConnectionCounter = new Gauge({
    name: 'lcn_voice_connection_counter',
    help: 'The total number of voice connections',
    registers: [register],
    labelNames: ['shard']
})

export const wsPingGauge = new Gauge({
    name: 'lcn_ws_ping',
    help: 'The average ping of all WebSockets',
    registers: [register],
    labelNames: ['identifier', 'shard']
})

export const wsStatusGauge = new Gauge({
    name: 'lcn_ws_status',
    help: 'The current status of WebSocket',
    registers: [register],
    labelNames: ['identifier', 'shard']
})

export const lavaNodeLoadGauge = new Gauge({
    name: 'lcn_lava_node_load',
    help: 'The current usage of lava node',
    registers: [register],
    labelNames: ['node']
})

export const lavaNodePlayersCounter = new Gauge({
    name: 'lcn_lava_node_players_counter',
    help: 'The number of total players of the node',
    registers: [register],
    labelNames: ['node']
})

export const lavaNodePlayingPlayersCounter = new Gauge({
    name: 'lcn_lava_node_playing_players_counter',
    help: 'The number of playing players of the node',
    registers: [register],
    labelNames: ['node']
})
