const { ShardingManager, Collection } = require('discord.js')
const { connect } = require('mongoose')
const logger = require('../Logger')
const Statistics = require('./Statistics')
const Qiwi = require('../utility/Qiwi')
const Diamonder = require('../structures/Diamonder')

connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })

const manager = new ShardingManager('./internals/utility/Client.js', {
    token: process.env.CLIENT_TOKEN,
    respawn: true
})

const shards = Number(process.env.CLIENT_MAX_SHARDS)

manager.spawn({ amount: shards, delay: 20000, timeout: 60000 })

manager.on('shardCreate', shard => logger.info(`(Sharding Manager): Launching shard #${shard.id}`))

Statistics.schedule(manager)
Qiwi.syncBills()
Diamonder.scheduleDiamonded()

module.exports = manager
