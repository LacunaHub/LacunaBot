/**
 * @param {import('../../internals/Lacuna')} self
 */
const execute = async (self) => {
    const start_ms = Date.now() - self.readyTimestamp

    await self.logger.info(`(Start): ${self.user.username} started for ${start_ms}ms`)
    //await self.logger.telegram.info(`\`Start:\` ${bot_username} started for ${start_ms}ms`)

    return true
}

module.exports = {
    name: 'ready',
    fn: execute
}