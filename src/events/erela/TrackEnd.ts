import { EmbedBuilder, Message } from 'discord.js'
import { Player } from 'erela.js'
import numbro from 'numbro'

const handler = async (self, player: Player) => {
    const message = player.get<Message>('message')

    if (message) {
        const embed = new EmbedBuilder(message.embeds[0]).setDescription(
            `${player.queue.current.title} \`[${numbro(player.queue.current.duration / 1000).format({ output: 'time' })}]\``
        )

        if (embed.data.footer?.text) embed.setFooter({ text: embed.data.footer.text.replace(/:[\w\W]+/i, `: ${player.queue.current.requester}`) })

        await message.delete().catch(() => {})
        await message.channel
            .send({ embeds: [embed], components: message.components })
            .then(message => player.set('message', message))
            .catch(() => player.set('message', null))
    }

    return true
}

export default {
    name: 'trackEnd',
    handler
}
