/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('@lavacord/discord.js').LavalinkNode} node
 */
const execute = async (self, node) => {
    await self.logger.info(`(Player Manager): Node ${node.id} ready to use`)
}

module.exports = {
    name: 'playerNodeReady',
    fn: execute
}