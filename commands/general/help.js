const { MessageEmbed, Permissions } = require('discord.js')
const { Buttons } = require('../../internals/utility/Client')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const provided_command = args[0]

    if (!provided_command) {
        const commands = self.commands.filter(c => !c.private && !(c.premium_only && !server.server.premium.available))
        const custom = server.commands.custom.filter(c => c.name && !c.inactive && !c.hidden)

        const categories = {
            general: commands.filter(c => {
                const config = server.commands.system.find(e => e.name == c.name)
                return c.group == 'general' && (!config || (config && !config.inactive))
            }),
            moderation: commands.filter(c => {
                const config = server.commands.system.find(e => e.name == c.name)
                return c.group == 'moderation' && (!config || (config && !config.inactive))
            }),
            music: commands.filter(c => {
                const config = server.commands.system.find(e => e.name == c.name)
                return c.group == 'music' && (!config || (config && !config.inactive))
            }),
            utility: commands.filter(c => {
                const config = server.commands.system.find(e => e.name == c.name)
                return c.group == 'utility' && (!config || (config && !config.inactive))
            })
        }
    
        const embed = new MessageEmbed()
            .setTitle(locale.help.texts.title)
            .setDescription(self.translator.format(locale.help.texts.description, `\`${server.prefix}\``))
            .setFooter(self.translator.format(locale.help.texts.use_help_for_detail_info, server.prefix))

        const website = new Buttons.MessageButton()
            .setStyle('url')
            .setLabel(locale.help.texts.links.website)
            .setURL('https://www.voidlacuna.ru')

        const docs = new Buttons.MessageButton()
            .setStyle('url')
            .setLabel(locale.help.texts.links.docs)
            .setURL('https://docs.voidlacuna.ru')

        const listing = new Buttons.MessageButton()
            .setStyle('url')
            .setLabel(locale.help.texts.links.listing)
            .setURL('https://www.spherecord.net')
    
        if (categories.general.size) embed.addField(locale.help.texts.categories.general, categories.general.map(c => `\`${c.name}\``).join(', '))
        if (categories.moderation.size) embed.addField(locale.help.texts.categories.moderation, categories.moderation.map(c => `\`${c.name}\``).join(', '))
        if (categories.music.size) embed.addField(locale.help.texts.categories.music, categories.music.map(c => `\`${c.name}\``).join(', '))
        if (categories.utility.size) embed.addField(locale.help.texts.categories.utility, categories.utility.map(c => `\`${c.name}\``).join(', '))
        if (custom.length) embed.addField('Пользовательские', custom.map(c => `\`${c.name}\``).join(', '))
    
        await message.reply({ buttons: [website, docs, listing], embed: embed, allowedMentions: { repliedUser: false } })
    }

    else {
        const command = self.commands.find(c => !c.private && c.name == provided_command)
        const custom = server.commands.custom.find(c => !c.inactive && !c.hidden && c.name == provided_command)

        if (!command && !custom) {
            await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.help.texts.command_not_found, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

            return false
        }

        if (command) {
            const docs = locale[command.name]

            const embed = new MessageEmbed()
                .setTitle('Справка по команде')
                .setDescription(docs.description)
                
            if (command.self_permissions.length || command.user_permissions.length) {
                const self_permissions = command.self_permissions.length ? `${locale.help.texts.permissions.self}\n- ${command.self_permissions.map(p => locale.common.permissions[p]).join('\n- ')}` : `~~${locale.help.texts.permissions.self}~~`
                const user_permissions = command.user_permissions.length ? `${locale.help.texts.permissions.user}\n- ${command.user_permissions.map(p => locale.common.permissions[p]).join('\n- ')}` : `~~${locale.help.texts.permissions.user}~~`
                
                embed.addField(locale.help.texts.permissions.title, `${self_permissions}\n${user_permissions}`)
            }
            
            if (docs.arguments) {
                const args_map = docs.arguments.map(a => `${a.required ? '<' : '['}${a.name}${a.required ? '>' : ']'}`).join(' ')
                
                const args_doc = docs.arguments.map(a => {
                    return `\`${a.required ? '<' : '['}${a.name}${a.required ? '>' : ']'}\`: ${a.description}` +
                    `\n- ${a.required ? locale.help.texts.required : locale.help.texts.optional}` +
                    `\n- ${self.translator.format(locale.help.texts.type, a.types.map(t => locale.common.args_types[t].toLowerCase()).join(', '))}`
                }).join('\n\n')
    
                embed.addField(locale.help.texts.usage, `\`${server.prefix}${command.name} ${args_map}\``)
                embed.addField(locale.help.texts.args, args_doc)
            }
    
            if (command.aliases.length) embed.addField(locale.help.texts.aliases, command.aliases.map(a => `\`${a}\``).join(', '))
    
            if (command.subcommands.size) {
                const usages = command.subcommands.map(s => {
                    const args_pattern = docs[s.name].arguments ? ' ' + docs[s.name].arguments.map(a => `${a.required ? '<' : '['}${a.name}${a.required ? '>' : ']'}`).join(' ') : ''
    
                    return `\`${server.prefix}${command.name} ${s.name}${args_pattern}\`: ${docs[s.name].description}`
                }).join('\n\n')
    
                const subcmd_doc = command.subcommands.map(s => {
                    if (!docs[s.name].arguments) return null
    
                    const args_doc = docs[s.name].arguments.map(a => {
                        return `\`${a.required ? '<' : '['}${a.name}${a.required ? '>' : ']'}\`: ${a.description}` +
                        `\n- ${a.required ? locale.help.texts.required : locale.help.texts.optional}` +
                        `\n- ${self.translator.format(locale.help.texts.type, a.types.map(t => locale.common.args_types[t].toLowerCase()).join(', '))}`
                    }).join('\n')
                
                    return {
                        name: `${command.name} ${s.name}${s.aliases.length ? `/${s.aliases.join('/')}` : ''}`,
                        args: args_doc
                    }
                }).filter(a => a)
    
                const usage_field = embed.fields.find(e => e.name == locale.help.texts.usage)
    
                if (usage_field) usage_field.value = `${usage_field.value}\n\n${usages}`
                else embed.addField(locale.help.texts.usage, usages)
    
                for (const doc of subcmd_doc) embed.addField(doc.name, doc.args)
            }
    
            await message.reply({ embed: embed, allowedMentions: { repliedUser: false } })
        }

        if (custom && !command) {
            const embed = new MessageEmbed()
                .setTitle('Справка по команде')
                .setDescription(custom.description)

            if (custom.permissions) {
                let permissions = new Permissions(custom.permissions).toArray()
                if (permissions.includes('ADMINISTRATOR')) permissions = ['ADMINISTRATOR']
                const perms = `${locale.help.texts.permissions.user}\n- ${permissions.map(p => locale.common.permissions[p]).join('\n- ')}`

                embed.addField(locale.help.texts.permissions.title, perms)
            }

            const edit_roles = (custom.action & 1 << 1) === (1 << 1)
            const forward = (custom.action & 1 << 2) === (1 << 2)

            const actions = []

            if (edit_roles) {
                if (custom.response.roles.add.length) actions.push(`Добавляет роли ${custom.response.roles.add.map(r => `<@&${r}>`).join(', ')}`)
                if (custom.response.roles.remove.length) actions.push(`Убирает роли ${custom.response.roles.remove.map(r => `<@&${r}>`).join(', ')}`)
            }
            if (forward) actions.push(`Перенаправляет на команду ${custom.request.forward.split(' ')[0]}`)

            if (actions.length) embed.addField('Действия', `- ${actions.map(a => a).join('\n- ')}`)

            await message.reply({ embed: embed, allowedMentions: { repliedUser: false } })
        }
    }

    return true
}

module.exports = {
    fn: execute,
    name: 'help',
    group: 'general',
    description: 'commands.help.description',
    guild_only: true,
    self_permissions: ['SEND_MESSAGES', 'EMBED_LINKS']
}
