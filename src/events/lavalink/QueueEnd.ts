import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { Player } from '@lacunahub/lavaluna.js'
import { Message } from 'discord.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, player: Player) => {
    const message = player.get<Message>('message')
    const server: ServerDocument = await self.db.servers.fetch({ _id: player.options.guildId })
    const t = self.i18n.t.bind(null, server.locale)

    if (message) {
        try {
            await message.edit({ components: [] })
        } catch (err) {
            await self.logger.handleError({
                module: 'MusicQueueEnd',
                action: 'RemoveComponentsFromPlayerMessage',
                error: err,
                guild_id: player.guildId
            })
        }
    }

    /**
     * Remove voice channel status if enabled in settings.
     * TODO: Use a proper method when discord.js has one.
     * TODO: Use a proper permission instead of a BigInt when discord.js has one.
     */
    const selfHasStatusPermission = message.member.permissions.has(BigInt(281474976710656))
    if (server.modules.music.voice_status.enabled && player.state === 'CONNECTED' && selfHasStatusPermission) {
        self.rest.put(`/channels/${player.options.voiceChannelId}/voice-status`, {
            body: { status: t('Commands.QueueCommand.Texts.EmptyQueueStatus') }
        })
    }

    player.set('message', null)
    player.set(
        'timeout',
        setTimeout(() => player.destroy(), 300000)
    )
    await self.db.qdb.delete(`guildPlayers.${player.guildId}`)

    self.logger.log(`[LavaQueueEnd] Queue of player ${player.guildId} ended`)
    await self.logger.appendServerLog(player.guildId, {
        level: 'LOG',
        module: 'Music',
        action: 'QueueEnd',
        message: 'The player queue has ended'
    })

    return true
}

export default {
    name: 'queueEnd',
    handler
}
