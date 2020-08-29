const { MessageEmbed } = require('discord.js')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    let amount = args[0]

    if (!amount) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.prune.texts.no_amount_argument, `**${message.author.username}**`)}`)

        return false
    }

    amount = amount.match(/\d+/)
    amount = Number(amount ? amount : 10)

    const mention = message.mentions.users.first()

    const reason = args.slice(mention ? 2 : 1).join(' ')

    if (amount < 2) amount = 2
    else if (amount > 100) amount = 100
    
    if (message.deletable && !message.deleted) await message.delete()

    if (mention) {
        let messages = await message.channel.messages.fetch({ limit: amount }, false)
        messages = messages.filter(m => m.author.id == mention.id)

        await message.channel.bulkDelete(messages)
        const success = await message.channel.send(`${self._emojis.OK} | ${self.translator.format(locale.prune.texts.messages_pruned, `**${message.author.username}**`, amount)}`)
        await success.delete({ timeout: 1000 })
    }

    else {
        await message.channel.bulkDelete(amount, true)
        const success = await message.channel.send(`${self._emojis.OK} | ${self.translator.format(locale.prune.texts.messages_pruned, `**${message.author.username}**`, amount)}`)
        await success.delete({ timeout: 1000 })
    }

    const case_log = message.guild.channels.cache.get(server.moderation.case_log.channel_id)
    const case_id = server.moderation.case_log.cases.length + 1

    if (case_log) {
        await self.db.servers.update({ _id: message.guild.id }, {
            $push: {
                'moderation.case_log.cases': {
                    case_id: case_id,
                    type: 1 << 5,
                    timestamp: Date.now(),
                    reason: reason ? `${amount}:${reason}` : '',
                    target: {
                        id: mention ? mention.id : '',
                        name: mention ? mention.tag : ''
                    },
                    executor: {
                        id: message.author.id,
                        name: message.author.tag
                    }
                }
            }
        })
    }

    const case_log_message = new MessageEmbed()
        .setTitle(locale.common.case_log.cases.PRUNE)
        .addField(locale.common.case_log.target, mention ? mention.tag : locale.common.texts.none, true)
        .addField(locale.common.case_log.executor, message.author.tag, true)
        .addField(locale.common.case_log.reason, reason || locale.common.texts.none)
        .setFooter(self.translator.format(locale.common.case_log.case, case_id))
        .setTimestamp()
        .setColor(0xE19517)

    if (case_log) await case_log.send(case_log_message)

    return true
}

module.exports = {
    fn: execute,
    name: 'prune',
    description: 'commands.prune.description',
    group: 'moderation',
    guild_only: true,
    self_permissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_MESSAGES'],
    user_permissions: ['MANAGE_MESSAGES']
}