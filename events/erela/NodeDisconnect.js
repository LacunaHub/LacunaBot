/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('erela.js').Node} node
 * @param {{ code: number, reason: string }} reason
 */
const handler = async (self, node, reason) => {
    await self.logger.info(`(Player Manager): Node ${node.options.identifier} disconnected with code ${reason.code}: ${reason.reason}`)

    return true
}

module.exports = {
    name: 'nodeDisconnect',
    handler
}