import Lacuna from '../internals/Lacuna'
import { AutoThread, ServerDocument } from '../database/schemas/Servers'
import { Message, MessageType, TextChannel } from 'discord.js'
import Replacer from './Replacer'

export async function autoThread(self: Lacuna, server: ServerDocument, message: Message) {
    const auto_thread: AutoThread = server.modules.autothreads
        .slice(0, server.server.premium.available ? 20 : 2)
        .find(ar => ar.channel_id == message.channel.id)

    if (auto_thread) {
        const content: string = message.content.toLowerCase()
        const split: string[] = content.split(/\s+/)

        if (
            (auto_thread.matches.length && !auto_thread.matches.some(m => split.includes(m.toLowerCase()))) ||
            (auto_thread.exclude_matches.length && auto_thread.exclude_matches.some(m => split.includes(m.toLowerCase())))
        )
            return false

        const replacer = new Replacer(
            auto_thread.name,
            {
                guild: message.guild,
                member: message.member,
                message: message
            }
        )
        const name = await replacer.replace()

        await (message.channel as TextChannel).threads.create({
            name: name,
            startMessage: message
        })

        self.emit('moduleExecution', {
            module: 'AutoThreads',
            guild: { id: message.guild.id, name: message.guild.name },
            target: { id: message.author.id, name: message.author.tag }
        })

        return true
    }

    return false
}