import { ButtonInteraction, InteractionCollector, Message, MessageEmbed } from 'discord.js'
import { Player } from 'erela.js'
import numbro from 'numbro'

const handler = async (self, player: Player) => {
    const message = player.get<Message>('message')

    if (message) {
        const embed = new MessageEmbed(message.embeds[0])
            .setDescription(`${player.queue.current.title} \`[${numbro(player.queue.current.duration / 1000).format({ output: 'time' })}]\``)
            
        if (embed.footer?.text) embed.setFooter({ text: embed.footer.text.replace(/:[\w\W]+/i, `: ${player.queue.current.requester}`) })

        await message.edit({ embeds: [embed] }).catch(() => { player.set('message', null); player.set('collector', null) })
        player.get<InteractionCollector<ButtonInteraction>>('collector')?.resetTimer()
    }

    return true
}

export default {
    name: 'trackEnd',
    handler
}