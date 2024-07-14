import { ServerDocument, ServerModulesAutoReaction, ServerModulesAutoThread } from '@lacunahub/lacuna-database-driver'
import { Message, TextChannel } from 'discord.js'
import { split } from 'unicode-default-word-boundary'
import Lacuna from '../internals/Lacuna'
import Replacer from './Replacer'

export async function addAutoReactions(self: Lacuna, server: ServerDocument, message: Message) {
    const autoReaction: ServerModulesAutoReaction = server.modules.autoreactions
        .slice(0, server.premium.available ? 20 : 2)
        .find(i => i.channel_id === message.channel.id)

    if (!autoReaction) return false

    if (autoReaction.message_types?.length) {
        const includesMessageType = autoReaction.message_types.map(v => AutoReactionMessageTypes[v]).includes(message.type)
        if (!includesMessageType) return false
    }

    const content = message.content.toLowerCase(),
        splittedContent = split(content)

    if (autoReaction.matches.length) {
        const match = autoReaction.matches.map(i => i.toLowerCase()).some(i => splittedContent.includes(i))
        if (!match) return false
    }

    if (autoReaction.exclude_matches.length) {
        const match = autoReaction.exclude_matches.map(i => i.toLowerCase()).some(i => splittedContent.includes(i))
        if (match) return false
    }

    for (const emoji of autoReaction.reactions) {
        try {
            await message.react(emoji.id || emoji.name)
        } catch (err) {
            await self.logger.handleError({
                module: 'AutoReactions',
                error: err,
                guild_id: message.guildId
            })
        }
    }

    self.emit('moduleExecution', {
        module: 'AutoReactions',
        guild: { id: message.guild.id, name: message.guild.name },
        target: { id: message.author.id, name: message.author.tag }
    })

    return true
}

export async function createAutoThread(self: Lacuna, server: ServerDocument, message: Message) {
    const autoThread: ServerModulesAutoThread = server.modules.autothreads
        .slice(0, server.premium.available ? 20 : 2)
        .find(i => i.channel_id === message.channel.id)

    if (!autoThread) return false

    const content = message.content.toLowerCase(),
        splittedContent = split(content)

    if (autoThread.matches.length) {
        const match = autoThread.matches.map(i => i.toLowerCase()).some(i => splittedContent.includes(i))
        if (!match) return false
    }

    if (autoThread.exclude_matches.length) {
        const match = autoThread.exclude_matches.map(i => i.toLowerCase()).some(i => splittedContent.includes(i))
        if (match) return false
    }

    const replacer = new Replacer(server.premium.available, {
            guild: message.guild,
            member: message.member,
            message: message
        }),
        name = await replacer.replace(autoThread.name)

    try {
        await (message.channel as TextChannel).threads.create({
            name: name.slice(0, 100),
            startMessage: message
        })
    } catch (err) {
        await self.logger.handleError({ module: 'AutoThreads', action: 'CreateThread', error: err, guild_id: message.guildId })

        return false
    }

    self.emit('moduleExecution', {
        module: 'AutoThreads',
        guild: { id: message.guild.id, name: message.guild.name },
        target: { id: message.author.id, name: message.author.tag }
    })

    return true
}

export enum AutoReactionMessageTypes {
    DEFAULT = 0,
    CHANNEL_PINNED_MESSAGE = 6,
    GUILD_MEMBER_JOIN = 7,
    USER_PREMIUM_GUILD_SUBSCRIPTION = 8,
    USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_1 = 9,
    USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_2 = 10,
    USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_3 = 11,
    CHANNEL_FOLLOW_ADD = 12,
    THREAD_CREATED = 18,
    REPLY = 19
}
