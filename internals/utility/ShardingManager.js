const { ShardingManager } = require('discord.js')
const { connect } = require('mongoose')
const logger = require('../Logger')
const Statistics = require('./Statistics')

connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })

const manager = new ShardingManager('./internals/utility/Client.js', {
    token: process.env.CLIENT_TOKEN,
    respawn: true
})

const shards = Number(process.env.CLIENT_MAX_SHARDS)

manager.spawn(shards, 15000)

manager.on('shardCreate', shard => logger.info(`(Sharding Manager): Launching shard #${shard.id}`))

Statistics.schedule(manager)

module.exports = manager
