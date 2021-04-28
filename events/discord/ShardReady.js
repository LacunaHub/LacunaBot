const Utility = require('../../database/schemas/Utility')

const shards = Number(process.env.CLIENT_MAX_SHARDS)

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {Number} id
 * @param {Set<String>} unavailable_guilds
 */
const execute = async (self, id, unavailable_guilds) => {
    const start_ms = Date.now() - self.start_timestamp

    await self.logger.info(`(Start): ${self.user.username}#${id} ready for ${start_ms}ms after start`)
    await self.logger.telegram.info(`\`Start:\` ${self.user.username}#${id} started for ${start_ms}ms`)

    if (id == (shards - 1)) {
        // setInterval(async () => {
        //     const guilds = await self.shard.fetchClientValues('guilds.cache.size')
        
        //     await Utility.updateOne({'charts': { $exists: true }}, {
        //         $push: {
        //             'charts.guilds': {
        //                 n: guilds.reduce((a, b) => a + b, 0),
        //                 ts: Date.now()
        //             }
        //         }
        //     })
        // }, 120000)
    }

    return true
}

module.exports = {
    name: 'shardReady',
    fn: execute
}