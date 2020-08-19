const { ShardingManager } = require('discord.js')
const { connect } = require('mongoose')
const logger = require('../Logger')

connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })

const manager = new ShardingManager('./internals/utility/Client.js', {
    token: process.env.CLIENT_TOKEN,
    respawn: true
})

manager.spawn(Number(process.env.CLIENT_MAX_SHARDS), 15000)

manager.on('shardCreate', shard => logger.info(`(Sharding Manager): Launching shard #${shard.id}`))

module.exports = manager