/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('@lavacord/discord.js').WebsocketCloseEvent} event
 * @param {import('@lavacord/discord.js').LavalinkNode} node
 */
const execute = async (self, event, node) => {
    await self.logger.info(`(Player Manager): Node ${node.id} disconnected for reason: ${event}`)
}

module.exports = {
    name: 'playerNodeDisconnect',
    fn: execute
}