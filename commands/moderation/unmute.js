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
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.unmute.texts.user_not_found, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const case_log = message.guild.channels.cache.get(server.moderation.case_log.channel_id)
    const case_id = server.moderation.case_log.cases.length + 1

    const mute_role = message.guild.roles.cache.get(server.moderation.roles.mute)

    const tempmute = self.tempmutes.find(m => m.user_id == mention.id)

    if (!mute_role && !mention.roles.cache.has(mute_role) && !tempmute) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.unmute.texts.user_not_muted, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (!mute_role.editable) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.unmute.texts.cant_remove_role, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    await message.react(self._emojis.details.OK.id).catch(self.logger.error)

    const case_log_message = new MessageEmbed()
        .setAuthor(locale.common.case_log.cases.MUTE_REMOVE, images.MUTE_REMOVE)
        .addField(locale.common.case_log.target, `${mention.user.tag}\n(${mention.id})`, true)
        .addField(locale.common.case_log.executor, message.author.tag, true)
        .addField(locale.common.case_log.reason, reason || locale.common.texts.none)
        .setFooter(self.translator.format(locale.common.case_log.case, case_id))
        .setTimestamp()
        .setColor('#2FDF84')

    if (tempmute) await tempmute.delete(false)
    else {
        const returnable_roles = server.moderation.roles.on_mute.returnable_roles.find(r => r.user_id == mention.id)

        if (returnable_roles) {
            await self.db.servers.update({ _id: message.guild.id }, {
                $pull: {
                    'moderation.roles.on_mute.returnable_roles': {
                        user_id: mention.id
                    }
                }
            })

            await mention.roles.add(returnable_roles.roles.filter(r => mention.guild.roles.cache.has(r)))
        }

        await mention.roles.remove(mute_role.id, reason).catch(self.logger.error)
    }

    if (case_log && server.moderation.case_log.case_types.MUTE_REMOVE) {
        await case_log.send(case_log_message).catch(self.logger.error)
    
        await self.db.servers.update({ _id: message.guild.id }, {
            $push: {
                'moderation.case_log.cases': {
                    case_id: case_id,
                    type: 1 << 4,
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
    name: 'unmute',
    description: 'commands.unmute.description',
    group: 'moderation',
    guild_only: true,
    self_permissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_ROLES'],
    user_permissions: ['MANAGE_ROLES']
}