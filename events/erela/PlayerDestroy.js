/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('erela.js').Player} player
 */
const handler = async (self, player) => {
    const message = player.get('message')

    if (message && !message.deleted) {
        await message.edit({ components: [] }).catch(() => {})
    }

    player.set('message', null)
    player.set('collector', null)

    return true
}

module.exports = {
    name: 'playerDestroy',
    handler
}