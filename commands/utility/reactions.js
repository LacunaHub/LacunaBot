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
    const locale = self.translator.locale(server.locale).commands

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
        await message.channel.send()

        return false
    }

    if (server.modules.reactions.length >= 250) {
        await message.channel.send()

        return false
    }

    const uid = ParseUID(args[0])

    if (uid) {
        const element = server.modules.reactions.find(r => r.id == uid)

        if (!element) {
            await message.channel.send(`${self._emojis.ERROR} |`)

            return false
        }

        if (element.references >= 3) {
            await message.channel.send(`${self._emojis.ERROR} |`)

            return false
        }

        const arg = args.slice(1).join(' ')
        const reference = message.mentions.channels.first() || message.guild.channels.cache.get(arg) || message.mentions.roles.first() || message.guild.roles.cache.find(r => r.id == arg || r.name == arg)

        if (!reference) {
            await message.channel.send(`${self._emojis.ERROR} |`)

            return false
        }

        if (element.references.includes(reference.id)) {
            await message.channel.send(`${self._emojis.ERROR} |`)

            return false
        }

        const type = 'type' in reference ? 'CHANNEL' : 'ROLE'

        if (type != element.type) {
            await message.channel.send(`${self._emojis.ERROR} |`)

            return false
        }

        const in_single_element = server.modules.reactions.some(r => (r.element.single || r.element.global_single) && r.references.includes(reference.id))

        if (in_single_element) {
            await message.channel.send(`${self._emojis.ERROR} |`)

            return false
        }

        if ((type == 'CHANNEL' && !reference.manageable) || (type == 'ROLE' && !reference.editable)) {
            await message.channel.send(`${self._emojis.ERROR} |`)

            return false
        }

        await self.db.servers.update({ _id: message.guild.id, 'modules.reactions.id': uid }, {
            $push: {
                'modules.reactions.$.references': reference.id
            }
        })

        await message.channel.send(`${self._emojis.OK} |`)

        return true
    }

    const raw_args = {
        channel: args[0],
        message_id: args[1],
        emoji: args[2],
        reference: args.slice(3).join(' ')
    }

    if (!raw_args.channel || !raw_args.message_id || !raw_args.emoji || !raw_args.reference) {
        await message.channel.send(`${self._emojis.ERROR} | `)

        return false
    }

    /**
     * @type {import('discord.js').TextChannel | import('discord.js').NewsChannel}
     */
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(raw_args.channel)
    const message_reaction = await channel.messages.fetch(raw_args.message_id, false)
    const emoji = Util.parseEmoji(raw_args.emoji)
    const reference = message.mentions.channels.last() || message.guild.channels.cache.find(c => c.id == raw_args.reference || c.name == raw_args.reference) || message.mentions.roles.first() || message.guild.roles.cache.find(r => r.id == raw_args.reference || r.name == raw_args.reference)

    if (!channel || !message_reaction || !emoji || !reference) {
        await message.channel.send(`${self._emojis.ERROR} |`)

        return false
    }

    if (message_reaction.reactions.cache.size == 20) {
        await message.channel.send(`${self._emojis.ERROR} |`)

        return false
    }

    const elements = server.modules.reactions
    const type = 'type' in reference ? 'CHANNEL' : 'ROLE'

    if (elements.some(r => r.message.id == message_reaction.id && r.references.includes(reference.id))) {
        await message.channel.send(`${self._emojis.ERROR} |`)

        return false
    }

    if (elements.some(r => (r.element.single || r.element.global_single) && r.references.includes(reference.id))) {
        await message.channel.send(`${self._emojis.ERROR} |`)

        return false
    }

    if ((type == 'CHANNEL' && !reference.manageable) || (type == 'ROLE' && !reference.editable)) {
        await message.channel.send(`${self._emojis.ERROR} |`)

        return false
    }

    const element_id = GenerateUID()

    try {
        await message_reaction.react(emoji.id || emoji.name)
    } catch (err) {
        switch (err.message) {
            case 'Unknown Emoji':
                await message.channel.send(`${self._emojis.ERROR} |`)
            break

            default:
                await message.channel.send(`${self._emojis.ERROR} |`)
            break
        }

        return false
    }

    const embed = new MessageEmbed()
        
    await message.channel.send(embed)

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
            await message.channel.send(`${self._emojis.ERROR} |`)
    
            return false
        }
    
        /**
         * @type {import('discord.js').TextChannel | import('discord.js').NewsChannel}
         */
        const channel = message.guild.channels.cache.get(element.message.channel_id)
        const message_reaction = await channel.messages.fetch(element.message.id, false)
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
    
        await message.channel.send(`${self._emojis.OK} |`)
    }

    else if (snowflake) {
        const elements = server.modules.reactions.filter(r => r.message.id == snowflake)

        if (!elements.length) {
            await message.channel.send(`${self._emojis.ERROR} |`)

            return false
        }

        /**
         * @type {import('discord.js').TextChannel | import('discord.js').NewsChannel}
         */
        const channel = message.guild.channels.cache.get(elements[0].message.channel_id)
        const message_reaction = await channel.messages.fetch(snowflake, false)

        await self.db.servers.update({ _id: message.guild.id }, {
            $pull: {
                'modules.reactions': {
                    'message.id': snowflake
                }
            }
        })

        await message_reaction.reactions.removeAll()
        await message.channel.send(`${self._emojis.OK} |`)
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
    const snowflake = ParseSnowflake(args[0])

    if (uid) {
        const element = server.modules.reactions.find(r => r.id == uid)

        if (!element) {
            await message.channel.send(`${self._emojis.ERROR} |`)
    
            return false
        }

        if (element.type == 'ROLE' && element.element.single) {
            await message.channel.send(`${self._emojis.ERROR} |`)
    
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

        await message.channel.send(`${self._emojis.OK} | `)
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
            await message.channel.send(`${self._emojis.ERROR} |`)
    
            return false
        }

        if (element.element.reverse) {
            await message.channel.send(`${self._emojis.ERROR} |`)
    
            return false
        }

        const duplicates = server.modules.reactions.filter(r => element.references.some(ref => r.references.includes(ref)))

        if (duplicates.length > 1) {
            await message.channel.send(`${self._emojis.ERROR} |`)
    
            return false
        }

        await self.db.servers.update({ _id: message.guild.id, 'modules.reactions.id': uid }, {
            $set: {
                'modules.reactions.$.element.single': element.element.single ? false : true
            }
        })

        await message.channel.send(`${self._emojis.OK} |`)
    }

    else if (snowflake) {
        const elements = server.modules.reactions.filter(r => r.message.id == snowflake && !r.element.reverse)

        if (!elements.length) {
            await message.channel.send(`${self._emojis.ERROR} |`)
    
            return false
        }

        if (elements.some(r => r.element.reverse)) {
            await message.channel.send(`${self._emojis.ERROR} |`)
    
            return false
        }

        const duplicates = server.modules.reactions.filter(r => elements.some(e => e.references.some(ref => r.references.includes(ref))))

        if (duplicates.length > 1) {
            await message.channel.send(`${self._emojis.ERROR} |`)
    
            return false
        }

        for (const element of elements) {
            await self.db.servers.update({ _id: message.guild.id, 'modules.reactions.id': element.id }, {
                $set: {
                    'modules.reactions.$.element.single': element.element.single ? false : true
                }
            })
        }

        await message.channel.send(`${self._emojis.OK} |`)
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