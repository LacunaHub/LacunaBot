import { CommandInteraction, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { commandOptionTypes } from '../../../internals/utility/Constants'

export default async (self: Lacuna, server: ServerDocument, interaction: CommandInteraction) => {
    const t = self.i18n.t.bind(null, server.locale)

    const command_name: string = interaction.options?.getString('команда')

    if (!command_name) {
        const commands = self.commands.filter(c => !c.private && !(c.premium_only && !server.server.premium.available))
        const customCommand = server.modules.custom_commands.map(i => i.command)

        const categories = {
            general: commands.filter(c => {
                const config = server.commands.configuration.find(e => e.name == c.name)
                return c.group == 'GENERAL' && (!config || (config && !config.inactive))
            }),
            moderation: commands.filter(c => {
                const config = server.commands.configuration.find(e => e.name == c.name)
                return c.group == 'MODERATION' && (!config || (config && !config.inactive))
            }),
            music: commands.filter(c => {
                const config = server.commands.configuration.find(e => e.name == c.name)
                return c.group == 'MUSIC' && (!config || (config && !config.inactive))
            }),
            utility: commands.filter(c => {
                const config = server.commands.configuration.find(e => e.name == c.name)
                return c.group == 'UTILITY' && (!config || (config && !config.inactive))
            })
        }

        const embed = new MessageEmbed()
            .setTitle(t('commands.help.text_commands_list'))
            .setDescription(t('commands.help.text_use_prefix', { prefix: `\`/\`` }))
            .setFooter({ text: t('commands.help.text_use_help_for_more_details', { prefix: '/' }) })

        const components = new MessageActionRow().addComponents(
            new MessageButton()
                .setStyle('LINK')
                .setLabel(t('commands.help.text_dashboard_link'))
                .setURL(`https://www.voidlacuna.ru/guilds/${interaction.guildId}/settings`),
            new MessageButton().setStyle('LINK').setLabel(t('commands.help.text_docs_link')).setURL('https://docs.voidlacuna.ru')
        )

        if (categories.general.size) embed.addField(t('common.command_categories.GENERAL'), categories.general.map(c => `\`${c.name}\``).join(', '))
        if (categories.moderation.size) embed.addField(t('common.command_categories.MODERATION'), categories.moderation.map(c => `\`${c.name}\``).join(', '))
        if (categories.music.size) embed.addField(t('common.command_categories.MUSIC'), categories.music.map(c => `\`${c.name}\``).join(', '))
        if (categories.utility.size) embed.addField(t('common.command_categories.UTILITY'), categories.utility.map(c => `\`${c.name}\``).join(', '))
        if (customCommand.length) embed.addField(t('common.command_categories.CUSTOM'), customCommand.map(c => `\`${c.name}\``).join(', '))

        await interaction.reply({ embeds: [embed], components: [components] })
    } else {
        const command = self.commands.find(c => !c.private && c.name == command_name)
        const customCommand = server.modules.custom_commands.map(i => i.command).find(i => i.name == command_name)

        if (!command && !customCommand) {
            await interaction.reply({
                content: `${self._emojis.ERROR} | ${t('commands.help.text_command_not_found', { user: `**${(interaction.member as any).displayName}**` })}`,
                ephemeral: true
            })

            return false
        }

        if (command) {
            const embed = new MessageEmbed().setTitle(t('commands.help.text_command_help', { command: command.name })).setDescription(t(command.description))

            if (command.permissions.self.length || command.permissions.user.length) {
                const self_permissions = command.permissions.self.length
                    ? `${t('commands.help.text_required_permissions_bot')}\n- ${command.permissions.self.map(p => t(`common.permissions_keys.${p}`)).join('\n- ')}`
                    : `~~${t('commands.help.text_required_permissions_bot')}~~`
                const user_permissions = command.permissions.user.length
                    ? `${t('commands.help.text_required_permissions_author')}\n- ${command.permissions.user.map(p => t(`common.permissions_keys.${p}`)).join('\n- ')}`
                    : `~~${t('commands.help.text_required_permissions_author')}~~`

                embed.addField(t('commands.help.text_required_permissions'), `${self_permissions}\n${user_permissions}`)
            }

            if (command.options?.filter(opt => !['SUB_COMMAND', 'SUB_COMMAND_GROUP'].includes(opt.type))?.length) {
                const usage =
                    `/${command.name} ` +
                    command.options
                        .map(opt => {
                            return `${opt.required ? '<' : '['}${t(opt.name)}${opt.required ? '>' : ']'}`
                        })
                        .join(' ')

                const args = command.options
                    .map(opt => {
                        return (
                            `\`${opt.required ? '<' : '['}${t(opt.name)}${opt.required ? '>' : ']'}\`: ${t(opt.description)}` +
                            `\n- ${opt.required ? t('commands.help.text_command_arg_required') : t('commands.help.text_command_arg_optional')}` +
                            `\n- ${t('commands.help.text_command_arg_type', {
                                type: t(`common.command_option_types.${opt.type}`)?.toLowerCase()
                            })}`
                        )
                    })
                    .join('\n')

                embed.addField(t('commands.help.text_command_usage'), `\`${usage}\``)
                embed.addField(t('commands.help.text_command_args'), args)
            }

            if (command.options?.filter(opt => ['SUB_COMMAND', 'SUB_COMMAND_GROUP'].includes(opt.type))?.length) {
                const usage = command.options
                    .map(opt => {
                        const args = opt?.options
                            ?.map(o => {
                                return `${o.required ? '<' : '['}${t(o.name)}${o.required ? '>' : ']'}`
                            })
                            .join(' ')

                        return `\`/${command.name} ${opt.name} ${args}\`: ${t(opt.description)?.toLowerCase()}`
                    })
                    .join('\n\n')

                const subcommands = command.options.map(opt => {
                    const args = opt.options
                        ?.map(o => {
                            return (
                                `\`${o.required ? '<' : '['}${t(o.name)}${o.required ? '>' : ']'}\`: ${t(o.description)}` +
                                `\n- ${o.required ? t('commands.help.text_command_arg_required') : t('commands.help.text_command_arg_optional')}` +
                                `\n- ${t('commands.help.text_command_arg_type', {
                                    type: t(`common.command_option_types.${o.type}`)?.toLowerCase()
                                })}`
                            )
                        })
                        .join('\n')

                    return { name: opt.name, value: args }
                })

                embed.addField(t('commands.help.text_command_usage'), usage)
                for (const sc of subcommands) embed.addField(`${command.name} ${sc.name}`, sc.value)
            }

            await interaction.reply({ embeds: [embed] })
        }

        if (customCommand && !command) {
            const embed = new MessageEmbed().setTitle(t('commands.help.text_command_help', { command: customCommand.name })).setDescription(customCommand.description)

            if (customCommand.options.length) {
                const usage =
                    `/${customCommand.name} ` +
                    customCommand.options
                        .map(opt => {
                            return `${opt.required ? '<' : '['}${opt.name}${opt.required ? '>' : ']'}`
                        })
                        .join(' ')

                const args = customCommand.options
                    .map(opt => {
                        return (
                            `\`${opt.required ? '<' : '['}${opt.name}${opt.required ? '>' : ']'}\`: ${opt.description}` +
                            `\n- ${opt.required ? t('commands.help.text_command_arg_required') : t('commands.help.text_command_arg_optional')}` +
                            `\n- ${t('commands.help.text_command_arg_type', {
                                type: t(`common.command_option_types.${commandOptionTypes[opt.type]}`)?.toLowerCase()
                            })}`
                        )
                    })
                    .join('\n')

                embed.addField(t('commands.help.text_command_usage'), `\`${usage}\``)
                embed.addField(t('commands.help.text_command_args'), args)
            }

            await interaction.reply({ embeds: [embed] })
        }
    }

    return true
}
