const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js')
const { resolveObjectPath } = require('../../../internals/utility/Utils')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 */
module.exports = async (self, server, message) => {
    const locale = self.translator.locale(server.locale)

    const command_name = message.args[0]

    if (!command_name) {
        const commands = self.commands.filter(c => !c.private && !(c.premium_only && !server.server.premium.available))
        const custom = server.commands.custom.filter(c => c.name && !c.inactive && !c.hidden)

        const categories = {
            general: commands.filter(c => {
                const config = server.commands.system.find(e => e.name == c.name)
                return c.group == 'GENERAL' && (!config || (config && !config.inactive))
            }),
            moderation: commands.filter(c => {
                const config = server.commands.system.find(e => e.name == c.name)
                return c.group == 'MODERATION' && (!config || (config && !config.inactive))
            }),
            music: commands.filter(c => {
                const config = server.commands.system.find(e => e.name == c.name)
                return c.group == 'MUSIC' && (!config || (config && !config.inactive))
            }),
            utility: commands.filter(c => {
                const config = server.commands.system.find(e => e.name == c.name)
                return c.group == 'UTILITY' && (!config || (config && !config.inactive))
            })
        }
    
        const embed = new MessageEmbed()
            .setTitle(locale.commands.help.texts.title)
            .setDescription(self.translator.format(locale.commands.help.texts.description, `\`${server.prefix}\``))
            .setFooter(self.translator.format(locale.commands.help.texts.use_help_for_detail_info, server.prefix))

        const components = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setStyle('LINK')
                    .setLabel(locale.commands.help.texts.links.website)
                    .setURL(`https://www.voidlacuna.ru/guilds/${message.guild.id}`),
                new MessageButton()
                    .setStyle('LINK')
                    .setLabel(locale.commands.help.texts.links.docs)
                    .setURL('https://docs.voidlacuna.ru')
            )
    
        if (categories.general.size) embed.addField(locale.commands.help.texts.categories.general, categories.general.map(c => `\`${c.name}\``).join(', '))
        if (categories.moderation.size) embed.addField(locale.commands.help.texts.categories.moderation, categories.moderation.map(c => `\`${c.name}\``).join(', '))
        if (categories.music.size) embed.addField(locale.commands.help.texts.categories.music, categories.music.map(c => `\`${c.name}\``).join(', '))
        if (categories.utility.size) embed.addField(locale.commands.help.texts.categories.utility, categories.utility.map(c => `\`${c.name}\``).join(', '))
        if (custom.length) embed.addField('Пользовательские', custom.map(c => `\`${c.name}\``).join(', '))
    
        await message.reply({ embeds: [embed], components: [components] })
    }

    else {
        const command = self.commands.find(c => !c.private && c.name == command_name)
        const custom = server.commands.custom.find(c => !c.inactive && !c.hidden && c.name == command_name)

        if (!command && !custom) {
            await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.commands.help.texts.command_not_found, `**${message.member.displayName}**`)}` })

            return false
        }

        if (command) {
            const embed = new MessageEmbed()
                .setTitle('Справка по команде')
                .setDescription(resolveObjectPath(command.description, locale))
                
            if (command.permissions.self.length || command.permissions.user.length) {
                const self_permissions = command.permissions.self.length ? `${locale.commands.help.texts.permissions.self}\n- ${command.permissions.self.map(p => locale.commands.common.permissions[p]).join('\n- ')}` : `~~${locale.commands.help.texts.permissions.self}~~`
                const user_permissions = command.permissions.user.length ? `${locale.commands.help.texts.permissions.user}\n- ${command.permissions.user.map(p => locale.commands.common.permissions[p]).join('\n- ')}` : `~~${locale.commands.help.texts.permissions.user}~~`
                
                embed.addField(locale.commands.help.texts.permissions.title, `${self_permissions}\n${user_permissions}`)
            }

            if (command.options?.filter(opt => !['SUB_COMMAND', 'SUB_COMMAND_GROUP'].includes(opt.type))?.length) {
                const usage = server.prefix + command.name + ' ' + command.options.map(opt => {
                    return `${opt.required ? '<' : '['}${resolveObjectPath(opt.name, locale)}${opt.required ? '>' : ']'}`
                }).join(' ')

                const arguments = command.options.map(opt => {
                    return `\`${opt.required ? '<' : '['}${resolveObjectPath(opt.name, locale)}${opt.required ? '>' : ']'}\`: ${resolveObjectPath(opt.description, locale)}` +
                        `\n- ${opt.required ? locale.commands.help.texts.required : locale.commands.help.texts.optional}` +
                        `\n- ${self.translator.format(locale.commands.help.texts.type, resolveObjectPath(`commands.common.command_option_types.${opt.type}`, locale)?.toLowerCase())}`
                }).join('\n')

                embed.addField(locale.commands.help.texts.usage, `\`${usage}\``)
                embed.addField(locale.commands.help.texts.args, arguments)
            }

            if (command.options?.filter(opt => ['SUB_COMMAND', 'SUB_COMMAND_GROUP'].includes(opt.type))?.length) {
                const usage = command.options.map(opt => {
                    const arguments = opt?.options?.map(o => {
                        return `${o.required ? '<' : '['}${resolveObjectPath(o.name, locale)}${o.required ? '>' : ']'}`
                    }).join(' ')

                    return `\`${server.prefix}${command.name} ${opt.name} ${arguments}\`: ${resolveObjectPath(opt.description, locale)?.toLowerCase()}`
                }).join('\n\n')

                const subcommands = command.options.map(opt => {
                    const arguments = opt.options?.map(o => {
                        return `\`${o.required ? '<' : '['}${resolveObjectPath(o.name, locale)}${o.required ? '>' : ']'}\`: ${resolveObjectPath(o.description, locale)}` +
                            `\n- ${o.required ? locale.commands.help.texts.required : locale.commands.help.texts.optional}` +
                            `\n- ${self.translator.format(locale.commands.help.texts.type, resolveObjectPath(`commands.common.command_option_types.${o.type}`, locale)?.toLowerCase())}`
                    }).join('\n')

                    return { name: opt.name, value: arguments }
                })

                embed.addField(locale.commands.help.texts.usage, usage)
                for (const sc of subcommands) embed.addField(`${command.name} ${sc.name}`, sc.value)
            }
    
            await message.reply({ embeds: [embed] })
        }

        if (custom && !command) {
            const embed = new MessageEmbed()
                .setTitle('Справка по команде')
                .setDescription(custom.description)

            await message.reply({ embeds: [embed] })
        }
    }

    return true
}
