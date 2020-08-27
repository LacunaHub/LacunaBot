/**
 * @param {import('../../internals/Lacuna')} self
 * @param {Number} nodes
 */
const execute = async (self, nodes) => {
    await self.logger.info(`(Player Manager): Player manager successfully connected to ${nodes} node(s)`)
}

module.exports = {
    name: 'playerManagerConnect',
    fn: execute
}