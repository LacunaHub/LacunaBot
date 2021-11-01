const Levels = require('../../../modules/Levels')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 */
const setPrefix = async (self, server, message) => {
    const locale = self.translator.locale(server.locale).commands

    const mention = message.mentions.members.first() || (message.args[0] ? (await message.guild.members.fetch(message.args[0])) : null)
    const level = Number(message.args[1])

    if (!mention) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.levels.set.texts.no_mention, `**${message.member.displayName}**`)}` })

        return false
    }

    if (!level || level < 1 || level > 2500) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.levels.set.texts.no_level, `**${message.member.displayName}**`)}` })

        return false
    }

    let total_xp = 0

    for (let i = 0; i < level; i++) {
        total_xp = total_xp + (150 + (i * i * 8))
    }

    const activity = await self.db.activities.fetch({ _id: message.guild.id })
    const levels = activity.levels.find(level => level.user_id == mention.id)
    
    if (!levels) {
        await self.db.activities.update({ _id: message.guild.id }, {
            $push: {
                levels: {
                    user_id: mention.id,
                    experience: { total: total_xp, current: 0, level: level },
                    activity: {
                        text: { total_messages: 0, last_message_at: null },
                        voice: { total_time: 0, connected_at: null, disconnected_at: null }
                    }
                }
            }
        })
    }

    else {
        await self.db.activities.update({ _id: message.guild.id, 'levels.user_id': mention.id }, {
            $set: {
                'levels.$.experience.level': level,
                'levels.$.experience.current': 0,
                'levels.$.experience.total': total_xp
            }
        })
    }

    await Levels.updateAwards(self, server, { member: mention, level })

    await message.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.levels.set.texts.set_success, `**${message.member.displayName}**`)}` })

    return true
}

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 */
const resetPrefix = async (self, server, message) => {
    const locale = self.translator.locale(server.locale).commands

    const mention = message.mentions.members.first() || (message.args[0] ? (await message.guild.members.fetch(message.args[0])) : null) || message.mentions.roles.first() || message.guild.roles.cache.find(r => r.id == message.args[0] || r.name == message.args[0])

    if (!mention) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.levels.reset.texts.no_mention, `**${message.member.displayName}**`)}` })

        return false
    }

    const is_role = 'color' in mention

    if (is_role) {
        await mention.members.forEach(async member => {
            await self.db.activities.update({ _id: message.guild.id }, {
                $pull: {
                    levels: {
                        user_id: member.id
                    }
                }
            })
        })
    }

    else {
        await self.db.activities.update({ _id: message.guild.id }, {
            $pull: {
                levels: {
                    user_id: mention.id
                }
            }
        })
    }

    await message.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.levels.reset.texts.reset_success, `**${message.member.displayName}**`)}` })

    return true
}

module.exports = { setPrefix, resetPrefix }