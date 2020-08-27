/**
 * @param {import('../../internals/Lacuna')} self
 * @param {any} err
 * @param {import('@lavacord/discord.js').LavalinkNode} node
 */
const execute = async (self, err, node) => {
    await self.logger.error(`(Player Manager): Node ${node.id}`, err.type, err.reason)
    //await self.logger.telegram.error(`\`\`\`\n${err.type}:\n${err.reason}\n\`\`\``)
}

module.exports = {
    name: 'playerNodeError',
    fn: execute
}