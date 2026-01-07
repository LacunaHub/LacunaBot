import {
    ServerDocument,
    ServerModerationAutoModAntiCaps,
    ServerModerationAutoModLinksFilter,
    ServerModerationAutoModSwearFilter,
    ServerModerationAutoModUsersSlowdown
} from '@/database/schemas/Servers'
import { GuildTextBasedChannel, Message } from 'discord.js'
import Lacuna from '../../../internals/Lacuna'
import Replacer from '../../Replacer'
import { ActionOptions } from './BanAction'

export default async function sendMessageAction(self: Lacuna, server: ServerDocument, options: SendMessageActionOptions) {
    const { config, message } = options

    try {
        const replacer = new Replacer(server.premium.available, { message: message, guild: message.guild, member: message.member }),
            messagePayload = await replacer.replaceTemplateMessage(config.send_message)

        await (message.channel as GuildTextBasedChannel).send(messagePayload)
    } catch (err) {
        await self.logger.handleError({ module: 'AutoMod', action: 'SendMessage', error: err, guild_id: message.guildId })
    }
}

export interface SendMessageActionOptions extends Omit<ActionOptions, 'guild' | 'target' | 'reason'> {
    config:
        | ServerModerationAutoModAntiCaps
        | ServerModerationAutoModLinksFilter
        | ServerModerationAutoModSwearFilter
        | ServerModerationAutoModUsersSlowdown
    message: Message
}
