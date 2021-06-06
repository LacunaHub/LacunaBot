const { MessageEmbed, Util } = require('discord.js')
const { GenerateUID, ParseUID } = require('../../modules/Reactions')
const { ParseSnowflake } = require('../../internals/utility/Utils')
const help = require('../general/help')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    await help.fn(self, server, message, ['reactions'])

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

    if (server.modules.reactions.length >= 100 && !server.server.premium.available) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.add.texts.reactions_limit_reached_no_premium, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (server.modules.reactions.length >= 250) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.add.texts.reactions_limit_reached, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const uid = ParseUID(args[0])

    if (uid) {
        const element = server.modules.reactions.find(r => r.id == uid)

        if (!element) {
            await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.reaction_element_not_found, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

            return false
        }

        if (element.references.length >= 3) {
            await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.add.texts.reaction_references_limit_reached, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

            return false
        }

        const arg = args.slice(1).join(' ')
        const reference = message.mentions.channels.first() || message.guild.channels.cache.get(arg) || message.mentions.roles.first() || message.guild.roles.cache.find(r => r.id == arg || r.name == arg)

        if (!reference) {
            await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.add.texts.reference_not_found, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

            return false
        }

        if (element.references.includes(reference.id)) {
            await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.add.texts.reference_already_added, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

            return false
        }

        const type = 'type' in reference ? 'CHANNEL' : 'ROLE'

        if (type != element.type) {
            await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.add.texts.reference_does_not_match, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

            return false
        }

        const in_single_element = server.modules.reactions.some(r => r.message.id == element.message.id && (r.element.single || r.element.global_single) && r.references.includes(reference.id))

        if (in_single_element) {
            await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.add.texts.reference_in_single_reaction, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

            return false
        }

        if ((type == 'CHANNEL' && !reference.manageable) || (type == 'ROLE' && !reference.editable)) {
            await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.add.texts.reference_not_manageable, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

            return false
        }

        await self.db.servers.update({ _id: message.guild.id, 'modules.reactions.id': uid }, {
            $push: {
                'modules.reactions.$.references': reference.id
            }
        })

        await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.reactions.add.texts.reference_success_added, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return true
    }

    const raw_args = {
        channel: args[0],
        message_id: args[1],
        emoji: args[2],
        reference: args.slice(3).join(' ')
    }

    if (!raw_args.channel || !raw_args.message_id || !raw_args.emoji || !raw_args.reference) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.add.texts.reactions_no_required_args, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    /**
     * @type {import('discord.js').TextChannel | import('discord.js').NewsChannel}
     */
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(raw_args.channel)

    let message_reaction
    try {
        message_reaction = await channel.messages.fetch(raw_args.message_id, false, true)
    } catch (err) {
        switch (err.message) {
            case 'Unknown Message':
                await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.add.texts.unknown_message, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })
            break

            default:
                await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.add.texts.unknown_error_on_fetch_message, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })
            break
        }

        return false
    }

    const emoji = self.utils.isSnowflake(raw_args.emoji) ? Util.parseEmoji(self.emojis.resolveIdentifier(raw_args.emoji)) : Util.parseEmoji(raw_args.emoji)
    const reference = message.mentions.channels.filter(c => c.id != channel.id).last() || message.guild.channels.cache.find(c => c.id == raw_args.reference || c.name == raw_args.reference) || message.mentions.roles.first() || message.guild.roles.cache.find(r => r.id == raw_args.reference || r.name == raw_args.reference)
    
    if (!channel || !message_reaction || !emoji || !reference) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.add.texts.reactions_invalid_args, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (message_reaction.reactions.cache.size == 20) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.add.texts.message_max_reactions, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const elements = server.modules.reactions
    const type = 'type' in reference ? 'CHANNEL' : 'ROLE'

    if (elements.some(r => r.message.id == message_reaction.id && r.emoji.name == emoji.name)) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.add.texts.emoji_already_used, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (elements.some(r => r.message.id == message_reaction.id && (r.element.single || r.element.global_single) && r.references.includes(reference.id))) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.add.texts.reaction_in_single_element, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if ((type == 'CHANNEL' && !reference.manageable) || (type == 'ROLE' && !reference.editable)) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.add.texts.reference_not_manageable, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    try {
        await message_reaction.react(emoji.id || emoji.name)
    } catch (err) {
        switch (err.message) {
            case 'Unknown Emoji':
                await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.add.texts.unknown_emoji, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })
            break

            default:
                await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.add.texts.unknown_error_on_react, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })
            break
        }

        return false
    }

    const element_id = GenerateUID()

    await self.db.servers.update({ _id: message.guild.id }, {
        $push: {
            'modules.reactions': {
                id: element_id,
                type: type,
                element: {
                    single: false,
                    global_single: false,
                    reverse: false,
                    lifespan: 0
                },
                message: {
                    id: message_reaction.id,
                    channel_id: channel.id
                },
                emoji: emoji,
                references: [reference.id]
            }
        }
    })

    const embed = new MessageEmbed()
        .setTitle(locale.reactions.add.texts.success.title)
        .addField(locale.reactions.add.texts.success.element_id, element_id, true)
        .addField(locale.reactions.add.texts.success.channel, `<#${channel.id}>`, true)
        .addField(locale.reactions.add.texts.success.message_id, message_reaction.id, true)
        .addField(locale.reactions.add.texts.success.emoji, emoji.id ? `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>` : emoji.name, true)
        .addField(locale.reactions.add.texts.success.reference, reference.name, true)
        .addField('\u200B', '\u200B', true)
        .setColor(0x43b581)
        
    await message.reply({ embed: embed, allowedMentions: { repliedUser: false } })

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

    const uid = ParseUID(args[0])
    const snowflake = ParseSnowflake(args[0])

    if (uid) {
        const element = server.modules.reactions.find(r => r.id == uid)

        if (!element) {
            await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.reaction_element_not_found, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })
    
            return false
        }
    
        /**
         * @type {import('discord.js').TextChannel | import('discord.js').NewsChannel}
         */
        const channel = message.guild.channels.cache.get(element.message.channel_id)

        let message_reaction
        try {
            message_reaction = await channel.messages.fetch(element.message.id, false, true)
        } catch (err) {
            console.log(err)
            switch (err.message) {
                case 'Unknown Message':
                    await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.add.texts.unknown_message, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })
                break
    
                default:
                    await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.add.texts.unknown_error_on_fetch_message, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })
                break
            }
    
            return false
        }
        
        const reaction = message_reaction.reactions.cache.get(element.emoji.id || element.emoji.name)
    
        await self.db.servers.update({ _id: message.guild.id }, {
            $pull: {
                'modules.reactions': {
                    id: uid
                }
            }
        })
    
        if (reaction) {
            await reaction.remove()
            await message_reaction.reactions.cache.delete(reaction.emoji.id || reaction.emoji.name)
        }
    
        await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.reactions.remove.texts.remove_reaction_success, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })
    }

    else if (snowflake) {
        const elements = server.modules.reactions.filter(r => r.message.id == snowflake)

        if (!elements.length) {
            await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.reaction_elements_not_found_by_message_id, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

            return false
        }

        /**
         * @type {import('discord.js').TextChannel | import('discord.js').NewsChannel}
         */
        const channel = message.guild.channels.cache.get(elements[0].message.channel_id)
        
        let message_reaction
        try {
            message_reaction = await channel.messages.fetch(elements[0].message.id, false, true)
        } catch (err) {
            switch (err.message) {
                case 'Unknown Message':
                    await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.add.texts.unknown_message, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })
                break
    
                default:
                    await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.add.texts.unknown_error_on_fetch_message, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })
                break
            }
    
            return false
        }

        await self.db.servers.update({ _id: message.guild.id }, {
            $pull: {
                'modules.reactions': {
                    'message.id': snowflake
                }
            }
        })

        await message_reaction.reactions.removeAll()
        await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.reactions.remove.texts.remove_reactions_success, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })
    }

    return true
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const reverse = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const uid = ParseUID(args[0])

    if (uid) {
        const element = server.modules.reactions.find(r => r.id == uid)

        if (!element) {
            await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.reaction_element_not_found, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })
    
            return false
        }

        if (element.type == 'ROLE' && element.element.single) {
            await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.reverse.texts.reaction_element_is_single, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })
    
            return false
        }

        await self.db.servers.update({ _id: message.guild.id, 'modules.reactions.id': uid }, {
            $set: {
                'modules.reactions.$.element.reverse': element.element.reverse ? false : true
            }
        })

        if (element.type == 'CHANNEL') {
            for (const reference of element.references) {
                const channel = message.guild.channels.cache.get(reference)

                if (channel && channel.manageable) await channel.createOverwrite(message.guild.id, { VIEW_CHANNEL: element.element.reverse ? null : false })
            }
        }

        await message.reply(`${self._emojis.OK} | ${element.element.reverse ? self.translator.format(locale.reactions.reverse.texts.reverse_inactive, `**${message.author.username}**`) : self.translator.format(locale.reactions.reverse.texts.reverse_active, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })
    }

    return true
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const single = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const uid = ParseUID(args[0])
    const snowflake = ParseSnowflake(args[0])

    if (uid) {
        const element = server.modules.reactions.find(r => r.id == uid)

        if (!element) {
            await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.reaction_element_not_found, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })
    
            return false
        }

        if (element.element.reverse) {
            await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.single.texts.reaction_element_is_reverse, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })
    
            return false
        }

        const duplicates = server.modules.reactions.filter(r => r.message.id == element.message.id && element.references.some(ref => r.references.includes(ref)))

        if (duplicates.length > 1) {
            await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.single.texts.reaction_element_duplicate, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })
    
            return false
        }

        await self.db.servers.update({ _id: message.guild.id, 'modules.reactions.id': uid }, {
            $set: {
                'modules.reactions.$.element.single': element.element.single ? false : true
            }
        })

        await message.reply(`${self._emojis.OK} | ${element.element.single ? self.translator.format(locale.reactions.single.texts.single_inactive, `**${message.author.username}**`) : self.translator.format(locale.reactions.single.texts.single_active, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })
    }

    else if (snowflake) {
        const elements = server.modules.reactions.filter(r => r.message.id == snowflake && !r.element.reverse)

        if (!elements.length) {
            await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.reaction_elements_not_found_by_message_id, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })
    
            return false
        }

        if (elements.some(r => r.element.reverse)) {
            await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.reactions.single.texts.reaction_elements_some_reverse, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })
    
            return false
        }

        let singled = 0
        for (const element of elements) {
            const duplicates = server.modules.reactions.filter(r => r.message.id == element.message.id && element.references.some(ref => r.references.includes(ref)))

            if (duplicates.length > 1) continue

            await self.db.servers.update({ _id: message.guild.id, 'modules.reactions.id': element.id }, {
                $set: {
                    'modules.reactions.$.element.single': element.element.single ? false : true
                }
            })

            singled++
        }

        await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.reactions.single.texts.single_message_toggle, `**${message.author.username}**`, singled)}`, { allowedMentions: { repliedUser: false } })
    }

    return true
}

module.exports = {
    fn: execute,
    name: 'reactions',
    description: 'commands.reactions.description',
    group: 'utility',
    subcommands: [
        {
            fn: add,
            name: 'add',
            description: 'commands.reactions.add.description',
            aliases: ['create']
        },
        {
            fn: remove,
            name: 'remove',
            description: 'commands.reactions.remove.description',
            aliases: ['delete']
        },
        {
            fn: reverse,
            name: 'reverse',
            description: 'commands.reactions.reverse.description'
        },
        {
            fn: single,
            name: 'single',
            description: 'commands.reactions.single.description'
        }
    ],
    guild_only: true,
    self_permissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_ROLES', 'MANAGE_CHANNELS', 'MANAGE_MESSAGES', 'READ_MESSAGE_HISTORY', 'ADD_REACTIONS'],
    user_permissions: ['ADMINISTRATOR']
}