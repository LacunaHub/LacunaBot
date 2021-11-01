/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('erela.js').Node} node
 * @param {Error} reason
 */
const handler = async (self, node, error) => {
    await self.logger.info(`(Player Manager): An error has occurred on node ${node.options.identifier}`, error?.stack ?? error?.message)

    return true
}

module.exports = {
    name: 'nodeError',
    handler
}