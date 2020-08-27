/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('@lavacord/discord.js').LavalinkNode} node
 */
const execute = async (self, node) => {
    await self.logger.log(`(Player Manager): Node ${node.id} is trying to reconnect`)
}

module.exports = {
    name: 'playerNodeReconnecting',
    fn: execute
}