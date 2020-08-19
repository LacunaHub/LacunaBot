/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ModuleExecutionData} data
 */
const execute = async (self, data) => {
    await self.logger.logm(data)
}

module.exports = {
    name: 'moduleExecution',
    fn: execute
}