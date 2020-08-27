/**
 * @param {import('../../internals/Lacuna')} self
 * @param {Number} id
 * @param {Set<String>} unavailable_guilds
 */
const execute = async (self, id, unavailable_guilds) => {
    const start_ms = Date.now() - self.start_timestamp

    await self.logger.info(`(Start): ${self.user.username}#${id} ready for ${start_ms}ms after start`)
    //await self.logger.telegram.info(`\`Start:\` ${bot_username} started for ${start_ms}ms`)

    return true
}

module.exports = {
    name: 'shardReady',
    fn: execute
}