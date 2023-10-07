import { Message, TextChannel } from 'discord.js'
import { split } from 'unicode-default-word-boundary'
import { AutoThread, ServerDocument } from '../database/schemas/Servers'
import Lacuna from '../internals/Lacuna'
import Replacer from './Replacer'

export async function autoThread(self: Lacuna, server: ServerDocument, message: Message) {
    const at: AutoThread = server.modules.autothreads.slice(0, server.server.premium.available ? 20 : 2).find(i => i.channel_id == message.channel.id)

    if (at) {
        const content: string = message.content.toLowerCase()
        const splitted: string[] = split(content)

        if (at.matches.length) {
            const match = at.matches.map(i => i.toLowerCase()).some(i => splitted.includes(i))

            if (!match) return false
        }

        if (at.exclude_matches.length) {
            const match = at.exclude_matches.map(i => i.toLowerCase()).some(i => splitted.includes(i))

            if (match) return false
        }

        const replacer = new Replacer({
                guild: message.guild,
                member: message.member,
                message: message
            }),
            name = await replacer.replace(at.name)

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

    return false
}
