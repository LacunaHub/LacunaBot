const help = require('../general/help')
const UID = require('../../internals/utility/UID')
const Levels = require('../../modules/Levels')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    await help.fn(self, server, message, ['levels'])

    return true
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const allow = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const argument = args.join(' ')

    if (!argument) {
        if (server.modules.levels.active) {
            await message.react(self._emojis.details.ERROR.id)

            return false
        }

        await self.db.servers.update({ _id: message.guild.id }, {
            $set: {
                'modules.levels.active': true
            }
        })

        await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.levels.allow.texts.levels_allowed, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return true
    }

    const reference = message.mentions.channels.first() || message.guild.channels.cache.get(argument) || message.mentions.roles.first() || message.guild.roles.cache.find(r => r.id == argument || r.name == argument)

    if (!reference) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.levels.allow.texts.no_reference, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const type = 'type' in reference ? 'CHANNEL' : 'ROLE'
    const includes = server.modules.levels.allowed.channels.includes(reference.id) || server.modules.levels.allowed.roles.includes(reference)
    const to = type == 'CHANNEL' ? 'channels' : 'roles'

    if (includes) {
        await self.db.servers.update({ _id: message.guild.id }, {
            $pull: {
                [`modules.levels.allowed.${to}`]: reference.id
            }
        })
    }

    else {
        await self.db.servers.update({ _id: message.guild.id }, {
            $push: {
                [`modules.levels.allowed.${to}`]: reference.id
            }
        })
    }

    await message.react(self._emojis.details.OK.id)

    return true
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const block = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const argument = args.join(' ')

    if (!argument) {
        if (!server.modules.levels.active) {
            await message.react(self._emojis.details.ERROR.id)

            return false
        }

        await self.db.servers.update({ _id: message.guild.id }, {
            $set: {
                'modules.levels.active': false
            }
        })

        await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.levels.block.texts.levels_blocked, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return true
    }

    const reference = message.mentions.channels.first() || message.guild.channels.cache.get(argument) || message.mentions.roles.first() || message.guild.roles.cache.find(r => r.id == argument || r.name == argument)

    if (!reference) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.levels.block.texts.no_reference, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const type = 'type' in reference ? 'CHANNEL' : 'ROLE'
    const includes = server.modules.levels.blocked.channels.includes(reference.id) || server.modules.levels.blocked.roles.includes(reference)
    const to = type == 'CHANNEL' ? 'channels' : 'roles'

    if (includes) {
        await self.db.servers.update({ _id: message.guild.id }, {
            $pull: {
                [`modules.levels.blocked.${to}`]: reference.id
            }
        })
    }

    else {
        await self.db.servers.update({ _id: message.guild.id }, {
            $push: {
                [`modules.levels.blocked.${to}`]: reference.id
            }
        })
    }

    await message.react(self._emojis.details.OK.id)

    return true
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const add = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    if (server.modules.levels.awards.length >= 250) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.levels.add.texts.awards_limit_reached, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const level = args[0] ? args[0].match(/\d+/) : null
    const award = args.slice(1).join(' ')

    const reference = message.mentions.roles.first() || message.guild.roles.cache.find(r => r.id == award || r.name == award)

    if (!level || (!award || !reference)) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.levels.add.texts.invalid_arguments, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (!reference.editable) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.levels.add.texts.not_editable_reference, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (level < 0 || level > 8000) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.levels.add.texts.invalid_level, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (server.modules.levels.awards.some(a => a.level == level)) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.levels.add.texts.level_award_exists, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (server.modules.levels.awards.some(a => a.references.includes(reference.id))) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.levels.add.texts.reference_already_used, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    await self.db.servers.update({ _id: message.guild.id }, {
        $addToSet: {
            'modules.levels.awards': {
                id: UID.simple(7),
                level: Number(level),
                type: 'type' in reference ? 'CHANNEL' : 'ROLE',
                references: [reference.id]
            }
        }
    })

    await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.levels.add.texts.award_added, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

    return true
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const remove = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const level = Number(args[0])

    if ((!level && level != 0) || isNaN(level)) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.levels.remove.texts.invalid_level_argument, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const award = server.modules.levels.awards.some(a => a.level == level)

    if (!award) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.levels.remove.texts.no_award_for_level, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    await self.db.servers.update({ _id: message.guild.id }, {
        $pull: {
            'modules.levels.awards': {
                level: level
            }
        }
    })

    await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.levels.remove.texts.award_removed, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

    return true
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const set = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    /**
     * @type {import('discord.js').GuildMember}
     */
    const mention = message.mentions.members.first() || (self.utils.isSnowflake(args[0]) ? await message.guild.members._fetchSingle({ user: args[0], cache: false }) : null)
    const level = isNaN(args[1]) ? null : Math.floor(Number(args[1]))

    if (!mention) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.levels.set.texts.no_mention, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (!level || level < 1 || level > 2500) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.levels.set.texts.no_level, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

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

    await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.levels.set.texts.set_success, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

    return true
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const reset = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    if (args[0] === 'all') {
        await self.db.activities.update({ _id: message.guild.id }, {
            $set: {
                levels: []
            }
        })

        await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.levels.reset.texts.reset_success, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return true
    }

    /**
     * @type {import('discord.js').GuildMember|import('discord.js').Role}
     */
    const mention = message.mentions.members.first() || (self.utils.isSnowflake(args[0]) ? await message.guild.members._fetchSingle({ user: args[0], cache: false }) : null) || message.mentions.roles.first() || message.guild.roles.cache.find(r => r.id == args[0] || r.name == args[0])

    if (!mention) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.levels.reset.texts.no_mention, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

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

    await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.levels.reset.texts.reset_success, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

    return true
}

module.exports = {
    fn: execute,
    name: 'levels',
    description: 'commands.levels.description',
    group: 'utility',
    subcommands: [
        {
            fn: allow,
            name: 'allow',
            description: 'commands.levels.allow.description'
        },
        {
            fn: block,
            name: 'block',
            description: 'commands.levels.block.description'
        },
        {
            fn: add,
            name: 'add',
            description: 'commands.levels.add.description'
        },
        {
            fn: remove,
            name: 'remove',
            description: 'commands.levels.remove.description'
        },
        {
            fn: set,
            name: 'set',
            description: 'commands.levels.set.description'
        },
        {
            fn: reset,
            name: 'reset',
            description: 'commands.levels.reset.description'
        }
    ],
    guild_only: true,
    self_permissions: ['SEND_MESSAGES'],
    user_permissions: ['ADMINISTRATOR']
}