/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('erela.js').Node} node
 */
const handler = async (self, node) => {
    await self.logger.info(`(Player Manager): Node ${node.options.identifier} successfully connected`)

    return true
}

module.exports = {
    name: 'nodeConnect',
    handler
}