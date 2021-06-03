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

    /**
     * @type {import('discord.js').GuildMember}
     */
    const mention = message.mentions.members.first() || (self.utils.isSnowflake(args[0]) ? await message.guild.members._fetchSingle({ user: args[0], cache: false }) : null)
    const reason = args.slice(1).join(' ')

    if (!mention) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.kick.texts.user_not_found, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (mention.hasPermission("KICK_MEMBERS")) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.kick.texts.user_has_moder_permission, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (!mention.kickable) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.kick.texts.cant_kick_user, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const case_log = message.guild.channels.cache.get(server.moderation.case_log.channel_id)
    const case_id = server.moderation.case_log.cases.length + 1

    await message.react(self._emojis.details.OK.id).catch(self.logger.error)

    const dm_message = new MessageEmbed()
        .setAuthor(locale.common.case_log.cases.KICK, images.KICK)
        .addField(locale.common.case_log.server, message.guild.name, true)
        .addField(locale.common.case_log.reason, reason || locale.common.texts.none, true)
        .setTimestamp()
        .setColor('#EF5350')

    const case_log_message = new MessageEmbed()
        .setAuthor(locale.common.case_log.cases.KICK, images.KICK)
        .addField(locale.common.case_log.target, `${mention.user.tag}\n(${mention.id})`, true)
        .addField(locale.common.case_log.executor, message.author.tag, true)
        .addField(locale.common.case_log.reason, reason || locale.common.texts.none)
        .setFooter(self.translator.format(locale.common.case_log.case, case_id))
        .setTimestamp()
        .setColor('#EF5350')

    await mention.send(dm_message).catch(self.logger.error)

    await mention.kick(reason).catch(self.logger.error)

    if (case_log && server.moderation.case_log.case_types.KICK) {
        await case_log.send(case_log_message).catch(self.logger.error)
    
        await self.db.servers.update({ _id: message.guild.id }, {
            $push: {
                'moderation.case_log.cases': {
                    case_id: case_id,
                    type: 1 << 2,
                    timestamp: Date.now(),
                    reason: reason || '',
                    target: {
                        id: mention.id,
                        name: mention.user.tag
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
    name: 'kick',
    description: 'commands.kick.description',
    group: 'moderation',
    guild_only: true,
    self_permissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'KICK_MEMBERS'],
    user_permissions: ['KICK_MEMBERS']
}