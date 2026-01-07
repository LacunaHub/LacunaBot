import { ServerDocument } from '@/database/schemas/Servers'
import { Player } from '@lacunahub/lavaluna.js'
import { Message } from 'discord.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, player: Player) => {
    const message = player.get<Message>('message'),
        timeout = player.get<NodeJS.Timeout>('timeout')
    const server: ServerDocument = await self.db.servers.fetch({ _id: player.options.guildId })

    if (message) {
        try {
            await message.edit({ components: [] })
        } catch (err) {
            await self.logger.handleError({
                module: 'MusicPlayerDestroy',
                action: 'RemoveComponentsFromPlayerMessage',
                error: err,
                guild_id: player.guildId
            })
        }
    }

    if (timeout) {
        clearTimeout(timeout)
    }

    /**
     * Remove voice channel status if enabled in settings.
     * TODO: Use a proper method when discord.js has one.
     * TODO: Use a proper permission instead of a BigInt when discord.js has one.
     */
    const selfHasStatusPermission = message.member.permissions.has(BigInt(281474976710656))
    if (server.modules.music.voice_status.enabled && selfHasStatusPermission) {
        self.rest.put(`/channels/${player.options.voiceChannelId}/voice-status`, {
            body: { status: '' }
        })
    }

    player.set('message', null)
    player.set('timeout', null)
    await self.db.qdb.delete(`guildPlayers.${player.guildId}`)

    self.logger.log(`[LavaPlayerDestroy] Player ${player.guildId} destroyed`)
    await self.logger.appendServerLog(player.guildId, {
        level: 'LOG',
        module: 'Music',
        action: 'PlayerDestroy',
        message: 'Player destroyed'
    })

    return true
}

export default {
    name: 'playerDestroy',
    handler
}
