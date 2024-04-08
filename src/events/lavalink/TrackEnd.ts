import { Player } from '@lacunahub/lavaluna.js'
import { EmbedBuilder, Message } from 'discord.js'
import numbro from 'numbro'
import Lacuna from '../../internals/Lacuna'
import { getTrackSourceByUrl } from '../../internals/utility/Utils'

const handler = async (self: Lacuna, player: Player) => {
    const message = player.get<Message>('message'),
        track = player.queue.current

    if (message && message.embeds[0]) {
        const trackSource = getTrackSourceByUrl(track.info.uri)
        const embed = new EmbedBuilder(message.embeds[0]).setTitle(`${track.info.author} - ${track.info.title}`)

        embed.data.fields[0].value = track.info.isStream ? '♾️' : `\`[${numbro(track.info.length / 1000).format({ output: 'time' })}]\``
        embed.data.fields[1].value = `⏭️ ${track.info.isStream ? '♾️' : `<t:${Math.round((Date.now() + track.info.length) / 1000)}:R>`}`
        embed.data.fields[2].value = `[${self.staticEmojis[trackSource.toUpperCase()] ?? ''} ${trackSource}](${track.info.uri})`

        if (embed.data.footer?.text) embed.setFooter({ text: embed.data.footer.text.replace(/\s[\w\W]+/i, ` ${track.requester}`) })
        if (track.info.artworkUrl) embed.setThumbnail(track.info.artworkUrl)

        try {
            if (player.state === 'CONNECTED') {
                await message.delete()
                const playerMessage = await message.channel.send({ embeds: [embed], components: message.components })
                player.set('message', playerMessage)
                self.db.qdb.set(`guildPlayers.${player.guildId}.messageId`, message.id)
            }
        } catch (err) {
            await self.logger.handleError({ module: 'MusicTrackEnd', action: 'RecreatePlayerMessage', error: err, guild_id: player.guildId })
            player.set('message', null)
        }
    }

    self.logger.log(`[LavaTrackEnd] Track playing for player ${player.guildId} ended`)
    await self.logger.appendServerLog(player.guildId, {
        level: 'LOG',
        module: 'Music',
        action: 'TrackEnd',
        message: `Track "${track.info.author} - ${track.info.title}" has ended`
    })

    return true
}

export default {
    name: 'trackEnd',
    handler
}
