import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    PermissionsBitField
} from 'discord.js'
import Lacuna from '../../../internals/Lacuna'
import { CommandGroup, CommandOption, CommandSubcommandGroupOption, CommandSubcommandOption } from '../../../internals/structures/Command'
import { commandOptionTypes } from '../../../internals/utility/Constants'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)

    const commandName: string = interaction.options?.getString('command')

    if (!commandName) {
        const commands = self.commands.filter(c => !c.private && !(c.premium && !server.premium.available))
        const customCommand = server.modules.custom_commands.map(i => i.command)

        const categories = {
            general: commands.filter(c => {
                const config = server.commands.configuration.find(e => e.name == c.name)
                return c.group === CommandGroup.General && (!config || (config && !config.inactive))
            }),
            moderation: commands.filter(c => {
                const config = server.commands.configuration.find(e => e.name == c.name)
                return c.group === CommandGroup.Moderation && (!config || (config && !config.inactive))
            }),
            music: commands.filter(c => {
                const config = server.commands.configuration.find(e => e.name == c.name)
                return c.group === CommandGroup.Music && (!config || (config && !config.inactive))
            }),
            utility: commands.filter(c => {
                const config = server.commands.configuration.find(e => e.name == c.name)
                return c.group === CommandGroup.Utility && (!config || (config && !config.inactive))
            })
        }

        const embed = new EmbedBuilder().setTitle(t('Commands.HelpCommand.Texts.ListOfCommands'))
        const embedFields = []

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel(t('Commands.HelpCommand.Texts.ControlPanel'))
                .setURL(`${process.env.LCN_WEBSITE_URL}/guilds/${interaction.guildId}/settings`),
            new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(t('Components.Header.Docs')).setURL(`https://docs.${process.env.LCN_ROOT_DOMAIN}`)
        )

        if (categories.general.size)
            embedFields.push({ name: t('Commands.Categories.General'), value: categories.general.map(v => `\`${v.name}\``).join(', ') })
        if (categories.moderation.size)
            embedFields.push({ name: t('Commands.Categories.Moderation'), value: categories.moderation.map(v => `\`${v.name}\``).join(', ') })
        if (categories.music.size)
            embedFields.push({ name: t('Commands.Categories.Music'), value: categories.music.map(v => `\`${v.name}\``).join(', ') })
        if (categories.utility.size)
            embedFields.push({ name: t('Commands.Categories.Useful'), value: categories.utility.map(v => `\`${v.name}\``).join(', ') })
        if (customCommand.length)
            embedFields.push({ name: t('Commands.Categories.Custom'), value: customCommand.map(v => `\`${v.name}\``).join(', ') })

        embed.addFields(embedFields)

        await interaction.reply({ embeds: [embed], components: [row] })
    } else {
        const command = self.commands.find(v => !v.private && v.name == commandName)
        const customCommand = server.modules.custom_commands.map(v => v.command).find(v => v.name == commandName)

        if (!command && !customCommand) {
            await interaction.reply({
                content: `${self.staticEmojis.Cross} | ${t('Commands.HelpCommand.Texts.UnknownCommand', {
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

            if (command.selfPermissions || command.defaultMemberPermissions) {
                const self_permissions = command.selfPermissions
                    ? `${t('Commands.HelpCommand.Texts.CommandPermissionsForBot')}\n- ${new PermissionsBitField(BigInt(command.selfPermissions))
                          .toArray()
                          .map(p => t(`Common.DiscordPermissions.${p}`))
                          .join('\n- ')}`
                    : `~~${t('Commands.HelpCommand.Texts.CommandPermissionsForBot')}~~`
                const user_permissions = command.defaultMemberPermissions
                    ? `${t('Commands.HelpCommand.Texts.CommandPermissionsForAuthor')}\n- ${new PermissionsBitField(
                          BigInt(command.defaultMemberPermissions)
                      )
                          .toArray()
                          .map(p => t(`Common.DiscordPermissions.${p}`))
                          .join('\n- ')}`
                    : `~~${t('Commands.HelpCommand.Texts.CommandPermissionsForAuthor')}~~`

                embed.addFields([
                    { name: t('Commands.HelpCommand.Texts.CommandRequiredPermissions'), value: `${self_permissions}\n${user_permissions}` }
                ])
            }

            if (command.options.length) {
                const usage = command.options
                    .map(v => {
                        if (v.type === ApplicationCommandOptionType.Subcommand) {
                            const args = v.options
                                ? v.options.map(vv => `${vv.required ? '<' : '['}${t(vv.name)}${vv.required ? '>' : ']'}`).join(' ')
                                : null

                            return `\`/${command.name} ${v.name}${args ? ` ${args}` : ''}\`: ${t(v.description)?.toLowerCase()}`
                        } else if (v.type === ApplicationCommandOptionType.SubcommandGroup) {
                        } else {
                            return `${v.required ? '<' : '['}${t(v.name)}${v.required ? '>' : ']'}`
                        }
                    })
                    .join('\n\n')

                if (command.options.every(v => v.type === ApplicationCommandOptionType.Subcommand)) {
                    const subcommands = (command.options as CommandSubcommandOption[]).map(v => {
                        const args = v.options
                            ? v.options
                                  .map(vv => {
                                      return (
                                          `\`${vv.required ? '<' : '['}${t(vv.name)}${vv.required ? '>' : ']'}\`: ${t(vv.description)}` +
                                          `\n- ${
                                              vv.required
                                                  ? t('Commands.HelpCommand.Texts.CommandArgumentRequired')
                                                  : t('Commands.HelpCommand.Texts.CommandArgumentOptional')
                                          }` +
                                          `\n- ${t('Commands.HelpCommand.Texts.CommandArgumentType', {
                                              type: t(`Commands.OptionTypes.${commandOptionTypes[vv.type]}`)?.toLowerCase()
                                          })}`
                                      )
                                  })
                                  .join('\n')
                            : null

                        return { name: v.name, value: args }
                    })

                    embed.addFields([{ name: t('Commands.HelpCommand.Texts.CommandUsage'), value: usage }])
                    embed.addFields([...subcommands.map(v => ({ name: `${command.name} ${v.name}`, value: v.value }))])
                } else if (command.options.every(v => v.type === ApplicationCommandOptionType.SubcommandGroup)) {
                } else {
                    const args = (command.options as Exclude<CommandOption, CommandSubcommandOption | CommandSubcommandGroupOption>[])
                        .map(v => {
                            return (
                                `\`${v.required ? '<' : '['}${t(v.name)}${v.required ? '>' : ']'}\`: ${t(v.description)}` +
                                `\n- ${
                                    v.required
                                        ? t('Commands.HelpCommand.Texts.CommandArgumentRequired')
                                        : t('Commands.HelpCommand.Texts.CommandArgumentOptional')
                                }` +
                                `\n- ${t('Commands.HelpCommand.Texts.CommandArgumentType', {
                                    type: t(`Commands.OptionTypes.${commandOptionTypes[v.type]}`)?.toLowerCase()
                                })}`
                            )
                        })
                        .join('\n')

                    embed.addFields([
                        { name: t('Commands.HelpCommand.Texts.CommandUsage'), value: `\`${usage}\`` },
                        { name: t('Commands.HelpCommand.Texts.CommandArguments'), value: args }
                    ])
                }
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
