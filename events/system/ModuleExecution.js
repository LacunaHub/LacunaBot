/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ModuleExecutionData} data
 */
const handler = async (self, data) => {
    self.logger.log(`(Module: ${data.module}): (${data.guild.name}:${data.guild.id}) (${data.target.name}:${data.target.id})`)
}

module.exports = {
    name: 'moduleExecution',
    handler
}