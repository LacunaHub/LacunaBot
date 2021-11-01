/**
 * @param {import('../../internals/Lacuna')} self
 */
const handler = async (self, d) => {
    await self.player?.updateVoiceState(d)

    return true
}

module.exports = {
    name: 'raw',
    handler
}