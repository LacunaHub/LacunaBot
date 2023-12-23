import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { commandOptionTypes } from '../../../internals/utility/Constants'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)

    const commandName: string = interaction.options?.getString('command')

    if (!commandName) {
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

        const embed = new EmbedBuilder().setTitle(t('Commands.HelpCommand.Texts.ListOfCommands'))
        const embedFields = []

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel(t('Commands.HelpCommand.Texts.ControlPanel'))
                .setURL(`${process.env.WEBSITE_URL}/guilds/${interaction.guildId}/settings`),
            new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(t('Components.Header.Docs')).setURL(`https://docs.${process.env.WEBSITE_DOMAIN}`)
        )

        if (categories.general.size)
            embedFields.push({ name: t('Commands.Categories.General'), value: categories.general.map(c => `\`${c.name}\``).join(', ') })
        if (categories.moderation.size)
            embedFields.push({ name: t('Commands.Categories.Moderation'), value: categories.moderation.map(c => `\`${c.name}\``).join(', ') })
        if (categories.music.size)
            embedFields.push({ name: t('Commands.Categories.Music'), value: categories.music.map(c => `\`${c.name}\``).join(', ') })
        if (categories.utility.size)
            embedFields.push({ name: t('Commands.Categories.Useful'), value: categories.utility.map(c => `\`${c.name}\``).join(', ') })
        if (customCommand.length)
            embedFields.push({ name: t('Commands.Categories.Custom'), value: customCommand.map(c => `\`${c.name}\``).join(', ') })

        embed.addFields(embedFields)

        await interaction.reply({ embeds: [embed], components: [row] })
    } else {
        const command = self.commands.find(c => !c.private && c.name == commandName)
        const customCommand = server.modules.custom_commands.map(i => i.command).find(i => i.name == commandName)

        if (!command && !customCommand) {
            await interaction.reply({
                content: `${self._emojis.ERROR} | ${t('Commands.HelpCommand.Texts.UnknownCommand', {
                    username: `**${interaction.member.displayName}**`
                })}`,
                ephemeral: true
            })

            return false
        }

        if (command) {
            const embed = new EmbedBuilder()
                .setTitle(t('Commands.HelpCommand.Texts.HelpForCommand', { command: command.name }))
                .setDescription(t(command.description))

            if (command.permissions.self.length || command.permissions.user.length) {
                const self_permissions = command.permissions.self.length
                    ? `${t('Commands.HelpCommand.Texts.CommandPermissionsForBot')}\n- ${command.permissions.self
                          .map(p => t(`Common.DiscordPermissions.${p}`))
                          .join('\n- ')}`
                    : `~~${t('Commands.HelpCommand.Texts.CommandPermissionsForBot')}~~`
                const user_permissions = command.permissions.user.length
                    ? `${t('Commands.HelpCommand.Texts.CommandPermissionsForAuthor')}\n- ${command.permissions.user
                          .map(p => t(`Common.DiscordPermissions.${p}`))
                          .join('\n- ')}`
                    : `~~${t('Commands.HelpCommand.Texts.CommandPermissionsForAuthor')}~~`

                embed.addFields([
                    { name: t('Commands.HelpCommand.Texts.CommandRequiredPermissions'), value: `${self_permissions}\n${user_permissions}` }
                ])
            }

            if (
                command.options?.filter(
                    opt => ![ApplicationCommandOptionType.Subcommand, ApplicationCommandOptionType.SubcommandGroup].includes(opt.type)
                )?.length
            ) {
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
                            `\n- ${
                                opt.required
                                    ? t('Commands.HelpCommand.Texts.CommandArgumentRequired')
                                    : t('Commands.HelpCommand.Texts.CommandArgumentOptional')
                            }` +
                            `\n- ${t('Commands.HelpCommand.Texts.CommandArgumentType', {
                                type: t(`Commands.OptionTypes.${commandOptionTypes[opt.type]}`)?.toLowerCase()
                            })}`
                        )
                    })
                    .join('\n')

                embed.addFields([
                    { name: t('Commands.HelpCommand.Texts.CommandUsage'), value: `\`${usage}\`` },
                    { name: t('Commands.HelpCommand.Texts.CommandArguments'), value: args }
                ])
            }

            if (
                command.options?.filter(opt =>
                    [ApplicationCommandOptionType.Subcommand, ApplicationCommandOptionType.SubcommandGroup].includes(opt.type)
                )?.length
            ) {
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
                                `\n- ${
                                    o.required
                                        ? t('Commands.HelpCommand.Texts.CommandArgumentRequired')
                                        : t('Commands.HelpCommand.Texts.CommandArgumentOptional')
                                }` +
                                `\n- ${t('Commands.HelpCommand.Texts.CommandArgumentType', {
                                    type: t(`Commands.OptionTypes.${commandOptionTypes[o.type]}`)?.toLowerCase()
                                })}`
                            )
                        })
                        .join('\n')

                    return { name: opt.name, value: args }
                })

                embed.addFields([{ name: t('Commands.HelpCommand.Texts.CommandUsage'), value: usage }])
                for (const sc of subcommands) embed.addFields([{ name: `${command.name} ${sc.name}`, value: sc.value }])
            }

            await interaction.reply({ embeds: [embed] })
        }

        if (customCommand && !command) {
            const embed = new EmbedBuilder()
                .setTitle(t('Commands.HelpCommand.Texts.HelpForCommand', { command: customCommand.name }))
                .setDescription(customCommand.description)

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
                            `\n- ${
                                opt.required
                                    ? t('Commands.HelpCommand.Texts.CommandArgumentRequired')
                                    : t('Commands.HelpCommand.Texts.CommandArgumentOptional')
                            }` +
                            `\n- ${t('Commands.HelpCommand.Texts.CommandArgumentType', {
                                type: t(`Commands.OptionTypes.${commandOptionTypes[opt.type]}`)?.toLowerCase()
                            })}`
                        )
                    })
                    .join('\n')

                embed.addFields([
                    { name: t('Commands.HelpCommand.Texts.CommandUsage'), value: `\`${usage}\`` },
                    { name: t('Commands.HelpCommand.Texts.CommandArguments'), value: args }
                ])
            }

            await interaction.reply({ embeds: [embed] })
        }
    }

    return true
}
