/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').CommandExecutionData} data
 */
const execute = async (self, data) => {
    await self.logger.logc(data.command.name, data.message)
}

module.exports = {
    name: 'commandExecution',
    fn: execute
}