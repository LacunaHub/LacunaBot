import {
    type ServerDocument,
    type ServerModerationAutoModAntiCaps,
    type ServerModerationAutoModLinksFilter,
    type ServerModerationAutoModSwearFilter,
    type ServerModerationAutoModUsersSlowdown
} from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import Replacer from '@/modules/Replacer.js'
import { type GuildTextBasedChannel, Message } from 'discord.js'
import { type ActionOptions } from './BanAction.js'

export default async function sendMessageAction(
    self: Lacuna,
    server: ServerDocument,
    options: SendMessageActionOptions
) {
    const { config, message } = options

    try {
        const replacer = new Replacer(server.premium.available, {
                message: message,
                guild: message.guild,
                member: message.member!
            }),
            messagePayload = await replacer.replaceTemplateMessage(config.send_message)

        await (message.channel as GuildTextBasedChannel).send(messagePayload)
    } catch (err) {
        self.logger.error({ module: 'AutoMod', action: 'SendMessage', err, guildId: message.guildId })
    }
}

export interface SendMessageActionOptions extends Omit<ActionOptions, 'guild' | 'target' | 'reason'> {
    config:
        | ServerModerationAutoModAntiCaps
        | ServerModerationAutoModLinksFilter
        | ServerModerationAutoModSwearFilter
        | ServerModerationAutoModUsersSlowdown
    message: Message<true>
}
