import { EmbedBuilder, Message } from 'discord.js'
import { Player } from 'erela.js'
import numbro from 'numbro'
import Lacuna from '../../internals/Lacuna'
import { getTrackSourceByUrl } from '../../internals/utility/Utils'

const handler = async (self: Lacuna, player: Player) => {
    const message = player.get<Message>('message')

    if (message && message.embeds[0]) {
        const track = player.queue.current
        const trackSource = getTrackSourceByUrl(track.uri)
        const embed = new EmbedBuilder(message.embeds[0]).setTitle(`${track.author} - ${track.title}`)

        embed.data.fields[0].value = track.isStream ? '♾️' : `\`[${numbro(track.duration / 1000).format({ output: 'time' })}]\``
        embed.data.fields[1].value = `⏭️ ${track.isStream ? '♾️' : `<t:${Math.round((Date.now() + track.duration) / 1000)}:R>`}`
        embed.data.fields[2].value = `[${self._emojis[trackSource.toUpperCase()] ?? ''} ${trackSource}](${track.uri})`

        if (embed.data.footer?.text) embed.setFooter({ text: embed.data.footer.text.replace(/\s[\w\W]+/i, ` ${track.requester}`) })

        await message.delete().catch(() => {})
        await message.channel
            .send({ embeds: [embed], components: message.components })
            .then(message => {
                player.set('message', message)
                self.db.qdb.set(`guildPlayers.${player.guild}.messageId`, message.id)
            })
            .catch(() => player.set('message', null))
    }

    self.logger.log(`[ErelaTrackEnd] Track playing for player ${player.guild} ended`)

    return true
}

export default {
    name: 'trackEnd',
    handler
}
