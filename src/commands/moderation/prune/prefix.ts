import { BaseGuildTextChannel, Message } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { caseLog } from '../../../modules/Moderation'

export default async (self: Lacuna, server: ServerDocument, message: Message) => {
    const locale = self.translator.locale(server.locale).commands

    const amount = isNaN(message['args'][0]) ? 0 : Number(message['args'][0])
    const mention = message.mentions.members.first() || (message['args'][1] ? await message.guild.members.fetch(message['args'][1]) : null)
    const reason = message['args'].slice(2).join(' ') || '-'

    if (!amount) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.prune.texts.no_amount_argument, `**${message.member.displayName}**`)}` })

        return false
    }

    if (Math.sign(amount) != 1 || amount < 2 || amount > 100) {
        await message.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.prune.texts.invalid_amount_argument, `**${message.member.displayName}**`)}`
        })

        return false
    }

    if (message.deletable) await message.delete()

    let _message: Message

    if (mention) {
        let messages = await message.channel.messages.fetch({ limit: amount }, { cache: false })
        messages = messages.filter(m => m.author.id == mention.id)

        const deleted = await (message.channel as BaseGuildTextChannel).bulkDelete(messages, true)
        _message = await message.channel.send({
            content: `${self._emojis.OK} | ${self.translator.format(locale.prune.texts.messages_pruned, `**${message.member.displayName}**`, deleted.size)}`
        })
    } else {
        const deleted = await (message.channel as BaseGuildTextChannel).bulkDelete(amount, true)
        _message = await message.channel.send({
            content: `${self._emojis.OK} | ${self.translator.format(locale.prune.texts.messages_pruned, `**${message.member.displayName}**`, deleted.size)}`
        })
    }

    setTimeout(async () => await _message.delete(), 2000)

    await caseLog.createCaseEntry(message.guild, { type: 'PRUNE_MESSAGES', target: mention.user, executor: message.author, reason })

    return true
}
