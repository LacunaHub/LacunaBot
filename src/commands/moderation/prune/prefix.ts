import { BaseGuildTextChannel, Collection, Message, MessageEmbed } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { images } from '../../../modules/Logs'

export default async (self: Lacuna, server: ServerDocument, message: Message) => {
    const locale = self.translator.locale(server.locale).commands

    const amount = isNaN(message['args'][0]) ? 0 : Number(message['args'][0])
    const mention = message.mentions.members.first() || (message['args'][1] ? (await message.guild.members.fetch(message['args'][1])) : null)
    const reason = message['args'].slice(2).join(' ') || '-'

    if (!amount) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.prune.texts.no_amount_argument, `**${message.member.displayName}**`)}` })

        return false
    }

    if (Math.sign(amount) != 1 || amount < 2 || amount > 100) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.prune.texts.invalid_amount_argument, `**${message.member.displayName}**`)}` })

        return false
    }

    if (message.deletable) await message.delete()

    let _message: Message

    if (mention) {
        let messages = await message.channel.messages.fetch({ limit: amount }, { cache: false })
        messages = messages.filter(m => m.author.id == mention.id)

        const deleted = await (message.channel as BaseGuildTextChannel).bulkDelete(messages, true)
        _message = await message.channel.send({ content: `${self._emojis.OK} | ${self.translator.format(locale.prune.texts.messages_pruned, `**${message.member.displayName}**`, deleted.size)}` })
    }

    else {
        const deleted = await (message.channel as BaseGuildTextChannel).bulkDelete(amount, true)
        _message = await message.channel.send({ content: `${self._emojis.OK} | ${self.translator.format(locale.prune.texts.messages_pruned, `**${message.member.displayName}**`, deleted.size)}` })
    }

    setTimeout(async () => await _message.delete(), 2000)

    const case_log = message.guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel
    const case_id: number = server.moderation.case_log.cases.length + 1

    const case_log_message = new MessageEmbed()
        .setAuthor({ name: locale.common.case_log.cases.PRUNE, iconURL: images.PRUNE_MESSAGES })
        .addField(locale.common.case_log.target, mention ? mention.user.tag : locale.common.texts.none, true)
        .addField(locale.common.case_log.executor, message.member.user.tag, true)
        .addField(locale.common.case_log.reason, `${reason} (<#${message.channel.id}>)`)
        .setFooter({ text: self.translator.format(locale.common.case_log.case, case_id) })
        .setTimestamp()
        .setColor('#EF5350')

    if (case_log && server.moderation.case_log.case_types.PRUNE_MESSAGES) {
        await case_log.send({ embeds: [case_log_message] }).catch(self.logger.error)
    
        await self.db.servers.updateOne({ _id: message.guild.id }, {
            $push: {
                'moderation.case_log.cases': {
                    case_id: case_id,
                    type: 1 << 5,
                    timestamp: Date.now(),
                    reason: reason ? `${amount}:${reason}` : '',
                    target: {
                        id: mention ? mention.id : '',
                        name: mention ? mention.user.tag : ''
                    },
                    executor: {
                        id: message.member.id,
                        name: message.member.user.tag
                    }
                }
            }
        })
    }

    return true
}