import Lacuna from '@/internals/Lacuna.js'
import { GuildMember, type MessageCreateOptions, MessagePayload } from 'discord.js'

export class DirectMessages {
    public static send(
        self: Lacuna,
        member: GuildMember,
        messagePayload: string | MessagePayload | MessageCreateOptions
    ) {
        self.logger.info({ guildId: member.guild.id, userId: member.id, messagePayload }, 'send direct message')
        throw new Error('Direct messages are temporarily disabled globally')
        // return member.send(messagePayload)
    }
}
