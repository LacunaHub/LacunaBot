const { MessageEmbed } = require('discord.js')
const { images } = require('../../modules/Logs')

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
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.prune.texts.no_amount_argument, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    amount = amount.match(/\d+/)
    amount = Number(amount ? amount : 10)

    /**
     * @type {import('discord.js').GuildMember}
     */
    const mention = message.mentions.members.first() || (self.utils.isSnowflake(args[0]) ? await message.guild.members._fetchSingle({ user: args[0], cache: false }) : null)

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

    const case_log_message = new MessageEmbed()
        .setAuthor(locale.common.case_log.cases.PRUNE, images.PRUNE_MESSAGES)
        .addField(locale.common.case_log.target, mention ? mention.user.tag : locale.common.texts.none, true)
        .addField(locale.common.case_log.executor, message.author.tag, true)
        .addField(locale.common.case_log.reason, `${reason || locale.common.texts.none} (<#${message.channel.id}>)`)
        .setFooter(self.translator.format(locale.common.case_log.case, case_id))
        .setTimestamp()
        .setColor('#EF5350')

    if (case_log && server.moderation.case_log.case_types.PRUNE_MESSAGES) {
        await case_log.send(case_log_message).catch(self.logger.error)
    
        await self.db.servers.update({ _id: message.guild.id }, {
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
                        id: message.author.id,
                        name: message.author.tag
                    }
                }
            }
        })
    }

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