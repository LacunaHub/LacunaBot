import { ServerDocument } from '@/database/schemas/Servers'
import { Player } from '@lacunahub/lavaluna.js'
import { Message } from 'discord.js'
import Lacuna from '../../internals/Lacuna'

async function handler(self: Lacuna, player: Player) {
    const message = player.get<Message>('message'),
        timeout = player.get<NodeJS.Timeout>('timeout'),
        track = player.queue.current
    const server: ServerDocument = await self.db.servers.fetch({ _id: message.guild.id })

    if (timeout) {
        clearTimeout(timeout)
        player.set('timeout', null)
    }

    if (message) {
        await self.db.qdb.set(`guildPlayers.${player.guildId}`, {
            guildId: player.guildId,
            voiceChannelId: player.voiceChannelId,
            textChannelId: player.textChannelId,
            messageId: message.id,
            volume: player.volume,
            trackRepeat: player.trackRepeat,
            queueRepeat: player.queueRepeat,
            queue: [...player.queue]
        })
    } else {
        await self.db.qdb.delete(`guildPlayers.${player.guildId}`)
    }

    self.logger.log(`[LavaTrackStart] Player ${player.guildId} playback started`)
    await self.logger.appendServerLog(player.guildId, {
        level: 'LOG',
        module: 'Music',
        action: 'TrackStart',
        message: `Track "${track.info.author} - ${track.info.title}" is playing now`
    })

    /**
     * Set voice channel status if enabled in settings.
     * TODO: Use a proper method when discord.js has one.
     * TODO: Check for existing status when Discord's API allows it and respect the force_set setting.
     * TODO: Use a proper permission instead of a BigInt when discord.js has one.
     */
    const selfHasStatusPermission = message.member.permissions.has(BigInt(281474976710656))
    if (server.modules.music.voice_status.enabled && selfHasStatusPermission) {
        self.rest.put(`/channels/${player.voiceChannelId}/voice-status`, {
            body: { status: `${track.info.author} - ${track.info.title}` }
        })
    }
}

export default {
    name: 'trackStart',
    handler
}
