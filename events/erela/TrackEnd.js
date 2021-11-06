const { MessageEmbed } = require('discord.js')
const numbro = require('numbro')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('erela.js').Player} player
 */
const handler = async (self, player) => {
    const message = player.get('message')

    if (message && !message.deleted) {
        const embed = new MessageEmbed(message.embeds[0])
            .setDescription(`${player.queue.current.title} \`[${numbro(player.queue.current.duration / 1000).format({ output: 'time' })}]\``)
            
        if (embed.footer?.text) embed.setFooter(embed.footer.text.replace(/:[\w\W]+/i, `: ${player.queue.current.requester}`))

        await message.edit({ embeds: [embed] }).catch(() => { player.set('message', null); player.set('collector', null) })
        player.get('collector')?.resetTimer()
    }

    return true
}

module.exports = {
    name: 'trackEnd',
    handler
}