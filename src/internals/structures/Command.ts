import { ServerDocument } from '@/database/schemas/Servers'
import {
    ApplicationCommandOptionAllowedChannelTypes,
    ApplicationCommandOptionType,
    ApplicationCommandType,
    ChatInputCommandInteraction,
    ContextMenuCommandBuilder,
    MessageContextMenuCommandInteraction,
    PermissionsBitField,
    PermissionsString,
    SlashCommandAttachmentOption,
    SlashCommandBooleanOption,
    SlashCommandBuilder,
    SlashCommandChannelOption,
    SlashCommandIntegerOption,
    SlashCommandMentionableOption,
    SlashCommandNumberOption,
    SlashCommandRoleOption,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
    SlashCommandUserOption,
    Team,
    User,
    UserContextMenuCommandInteraction
} from 'discord.js'
import i18n from '../../i18n'
import Lacuna from '../Lacuna'
import { normalizeCommandOption, truncateString } from '../utility/Utils'

export class Command {
    public self: Lacuna
    public name: string
    public prettyName: string | null
    public description: string
    public group: CommandGroup
    public options: CommandOption[]
    public defaultMemberPermissions: string | null
    public selfPermissions: string | null
    public nsfw: boolean
    public integrationTypes: CommandIntegrationTypes[]
    public contexts: CommandContexts[]
    public premium: boolean
    public private: boolean
    public uses: number

    private slashFn: CommandSlashFn
    private userFn: CommandUserFn
    private messageFn: CommandMessageFn
    private subcommandFns: Record<string, CommandSlashFn> | null

    public get isSlashCommand() {
        return typeof this.slashFn !== 'undefined' || !!this.subcommandFns
    }

    public get isUserContextCommand() {
        return typeof this.userFn !== 'undefined'
    }

    public get isMessageContextCommand() {
        return typeof this.messageFn !== 'undefined'
    }

    constructor(self: Lacuna, name: string, options: CommandOptions) {
        this.self = self

        this.name = name
        this.prettyName = options.prettyName ?? null

        this.description = options.description

        this.group = options.group

        this.options = options.options ?? []

        this.defaultMemberPermissions = options.defaultMemberPermissions
            ? new PermissionsBitField(options.defaultMemberPermissions).bitfield.toString()
            : null
        this.selfPermissions = options.selfPermissions ? new PermissionsBitField(options.selfPermissions).bitfield.toString() : null

        this.nsfw = !!options.nsfw

        this.integrationTypes = options.integrationTypes ?? [CommandIntegrationTypes.GuildInstall]
        this.contexts = options.contexts ?? [CommandContexts.Guild]

        this.premium = !!options.premium
        this.private = !!options.private

        this.uses = 0

        this.slashFn = options.slashFn
        this.userFn = options.userFn
        this.messageFn = options.messageFn
        this.subcommandFns = options.subcommandFns ?? null

        if ((typeof this.userFn !== 'undefined' || typeof this.messageFn !== 'undefined') && !this.prettyName)
            throw new RangeError('[Command#constructor] Property "prettyName" required for context commands')
    }

    public async execute(server: ServerDocument, interaction: CommandInteraction): Promise<boolean> {
        const t = this.self.i18n.t.bind(null, server.locale)
        const executable = this.executable(server, interaction)

        if (typeof executable === 'string') {
            let replyText = 'Commands.CommandExecutionDenied'
            if (executable === 'NoDisabled') replyText = 'Commands.CommandExecutionDisabled'

            await interaction.reply({
                content: `${this.self.staticEmojis.Cross} | ${t(replyText, { username: `**${interaction.user.username}**` })}`,
                ephemeral: true
            })

            return false
        }

        if (this.premium && !server.premium.available) {
            await interaction.reply({
                content: `${this.self.staticEmojis.Cross} | ${t('Commands.CommandExecutionOnlyWithPremium', {
                    username: `**${interaction.user.username}**`
                })}`,
                ephemeral: true
            })

            return false
        }

        const throttled = await this.throttled(server, interaction)

        if (throttled.status) {
            await interaction.reply({
                content: `${this.self.staticEmojis.Cross} | ${t('Commands.CommandThrottling', {
                    username: `**${interaction.user.username}**`,
                    time: `<t:${Math.round(throttled.retry_after / 1000)}:T>`
                })}`,
                ephemeral: true
            })

            return false
        }

        if (interaction.isChatInputCommand() || interaction.isButton() || interaction.isModalSubmit()) {
            const subcommandName = this.subcommandFns ? interaction.options?.getSubcommand() : null,
                subcommandFn = this.subcommandFns?.[subcommandName]

            if (subcommandFn) await subcommandFn(this.self, server, interaction)
            else await this.slashFn(this.self, server, interaction)
        } else if (interaction.isUserContextMenuCommand()) {
            await this.userFn(this.self, server, interaction)
        } else if (interaction.isMessageContextMenuCommand()) {
            await this.messageFn(this.self, server, interaction)
        }

        await this.throttle(server, interaction)
        this.uses++

        this.self.emit('commandExecution', {
            command: this.name,
            options:
                interaction.options?.data?.map(v => {
                    if (v.type === ApplicationCommandOptionType.Subcommand)
                        return {
                            name: v.name,
                            type: v.type,
                            value: v.value ?? null,
                            options: v.options.map(vv => ({ name: vv.name, type: vv.type, value: vv.value ?? null }))
                        }

                    return { name: v.name, type: v.type, value: v.value ?? null }
                }) ?? [],
            guild: { name: interaction.guild.name, id: interaction.guild.id },
            channel: { name: interaction.channel.name, id: interaction.channelId },
            user: { name: interaction.user.username, id: interaction.user.id }
        })

        return true
    }

    private executable(server: ServerDocument, interaction: CommandInteraction): string | null {
        if (this.self.application.owner instanceof User && this.self.application.owner.id === interaction.user.id) return null
        if (this.self.application.owner instanceof Team && this.self.application.owner.members.some(v => v.id === interaction.user.id)) return null

        if (this.private) {
            const ownerIds = []

            if (this.self.application.owner instanceof User) ownerIds.push(this.self.application.owner.id)
            else if (this.self.application.owner instanceof Team) ownerIds.push(...this.self.application.owner.members.map(v => v.id))

            return ownerIds.includes(interaction.user.id) ? null : 'No'
        }

        const commandConfig = server.commands.configuration.find(v => v.name === this.name)

        if (commandConfig?.inactive) return 'NoDisabled'

        return null
    }

    private async throttled(server: ServerDocument, interaction: CommandInteraction) {
        const config = server.commands.configuration.find(v => v.name === this.name)

        if (config?.options?.includes('THROTTLING')) {
            let path = `${interaction.guildId}.users.${interaction.user.id}`

            if (config.throttling?.type === 'PER_GUILD') {
                path = `${interaction.guildId}.guild`
            }

            if (config.throttling?.type === 'PER_CHANNEL') {
                path = `${interaction.guildId}.channels.${interaction.channelId}`
            }

            const throttled = (await this.self.db.qdb.get(`throttling.commands.${this.name}.${path}`)) as any

            if (throttled?.retry_after - Date.now() > 0) {
                return {
                    status: true,
                    retry_after: throttled.retry_after
                }
            }

            if (throttled?.remaining === -1) {
                await this.self.db.qdb.delete(`throttling.commands.${this.name}.${path}`)
            }

            return {
                status: false
            }
        }

        return {
            status: false
        }
    }

    private async throttle(server: ServerDocument, interaction: CommandInteraction) {
        const config = server.commands.configuration.find(v => v.name === this.name)

        if (this.self.application.owner instanceof User && this.self.application.owner.id === interaction.user.id) return null
        if (this.self.application.owner instanceof Team && this.self.application.owner.members.some(v => v.id === interaction.user.id)) return null

        if (config?.options?.includes('THROTTLING')) {
            let path = `${interaction.guildId}.users.${interaction.user.id}`

            if (config.throttling?.type === 'PER_GUILD') {
                path = `${interaction.guildId}.guild`
            }

            if (config.throttling?.type === 'PER_CHANNEL') {
                path = `${interaction.guildId}.channels.${interaction.channelId}`
            }

            let throttled = (await this.self.db.qdb.get(`throttling.commands.${this.name}.${path}`)) as any
            if (!throttled) {
                await this.self.db.qdb.set(`throttling.commands.${this.name}.${path}`, {
                    retry_after: Date.now(),
                    remaining: config.throttling.max_uses
                })

                throttled = (await this.self.db.qdb.get(`throttling.commands.${this.name}.${path}`)) as any
            }

            await this.self.db.qdb.sub(`throttling.commands.${this.name}.${path}.remaining`, 1)
            throttled.remaining--

            if (throttled.remaining <= 0) {
                await this.self.db.qdb.set(`throttling.commands.${this.name}.${path}.retry_after`, Date.now() + config.throttling.timeout * 1000)
                await this.self.db.qdb.set(`throttling.commands.${this.name}.${path}.remaining`, -1)
            }
        } else {
            const has = await this.self.db.qdb.has(`throttling.commands.${this.name}.${interaction.guildId}`)

            if (has) {
                await this.self.db.qdb.delete(`throttling.commands.${this.name}.${interaction.guildId}`)
            }
        }
    }

    public static buildJSON(type: CommandBuildJSONType, command: Command) {
        const tEn = i18n.t.bind(null, 'en'),
            tRu = i18n.t.bind(null, 'ru'),
            tUk = i18n.t.bind(null, 'uk'),
            tFr = i18n.t.bind(null, 'fr'),
            tDe = i18n.t.bind(null, 'de'),
            tPl = i18n.t.bind(null, 'pl')

        if (type === CommandBuildJSONType.Slash) {
            const slashCommand = new SlashCommandBuilder()
                .setName(command.name)
                .setDescription(truncateString(tEn(command.description)))
                .setDescriptionLocalizations({
                    ru: truncateString(tRu(command.description)),
                    uk: truncateString(tUk(command.description)),
                    fr: truncateString(tFr(command.description)),
                    de: truncateString(tDe(command.description)),
                    pl: truncateString(tPl(command.description))
                })
                .setDefaultMemberPermissions(command.defaultMemberPermissions)
                .setNSFW(command.nsfw)

            for (const option of command.options) {
                const buildOptions = (
                    builder: SlashCommandBuilder | SlashCommandSubcommandBuilder,
                    opt: Exclude<CommandOption, CommandSubcommandOption | CommandSubcommandGroupOption>
                ) => {
                    const name = normalizeCommandOption(tEn(opt.name)),
                        localizedNames = {
                            ru: normalizeCommandOption(tRu(opt.name)),
                            uk: normalizeCommandOption(tUk(opt.name)),
                            fr: normalizeCommandOption(tFr(opt.name)),
                            de: normalizeCommandOption(tDe(opt.name)),
                            pl: normalizeCommandOption(tPl(opt.name))
                        }
                    const description = truncateString(tEn(opt.description)),
                        localizedDescriptions = {
                            ru: truncateString(tRu(opt.description)),
                            uk: truncateString(tUk(opt.description)),
                            fr: truncateString(tFr(opt.description)),
                            de: truncateString(tDe(opt.description)),
                            pl: truncateString(tPl(opt.description))
                        }
                    const localizeChoices = (choices: (CommandStringOptionChoice | CommandNumericOptionChoice)[]) => {
                        return choices.map(v => {
                            return {
                                name: truncateString(tEn(v.name)),
                                name_localizations: {
                                    ru: truncateString(tRu(v.name)),
                                    uk: truncateString(tUk(v.name)),
                                    fr: truncateString(tFr(v.name)),
                                    de: truncateString(tDe(v.name)),
                                    pl: truncateString(tPl(v.name))
                                },
                                value: v.value as any
                            }
                        })
                    }

                    if (opt.type === ApplicationCommandOptionType.String) {
                        const optBuilder = new SlashCommandStringOption()
                            .setName(name)
                            .setNameLocalizations(localizedNames)
                            .setDescription(description)
                            .setDescriptionLocalizations(localizedDescriptions)

                        if (typeof opt.required === 'boolean') optBuilder.setRequired(opt.required)
                        if (Array.isArray(opt.choices)) optBuilder.setChoices(...localizeChoices(opt.choices))
                        if (typeof opt.minLength === 'number') optBuilder.setMinLength(opt.minLength)
                        if (typeof opt.maxLength === 'number') optBuilder.setMaxLength(opt.maxLength)
                        if (typeof opt.autocomplete === 'boolean') optBuilder.setAutocomplete(opt.autocomplete)

                        builder.addStringOption(optBuilder)
                    } else if (opt.type === ApplicationCommandOptionType.Integer) {
                        const optBuilder = new SlashCommandIntegerOption()
                            .setName(name)
                            .setNameLocalizations(localizedNames)
                            .setDescription(description)
                            .setDescriptionLocalizations(localizedDescriptions)

                        if (typeof opt.required === 'boolean') optBuilder.setRequired(opt.required)
                        if (Array.isArray(opt.choices)) optBuilder.setChoices(...localizeChoices(opt.choices))
                        if (typeof opt.minValue === 'number') optBuilder.setMinValue(opt.minValue)
                        if (typeof opt.maxValue === 'number') optBuilder.setMaxValue(opt.maxValue)
                        if (typeof opt.autocomplete === 'boolean') optBuilder.setAutocomplete(opt.autocomplete)

                        builder.addIntegerOption(optBuilder)
                    } else if (opt.type === ApplicationCommandOptionType.Number) {
                        const optBuilder = new SlashCommandNumberOption()
                            .setName(name)
                            .setNameLocalizations(localizedNames)
                            .setDescription(description)
                            .setDescriptionLocalizations(localizedDescriptions)

                        if (typeof opt.required === 'boolean') optBuilder.setRequired(opt.required)
                        if (Array.isArray(opt.choices)) optBuilder.setChoices(...localizeChoices(opt.choices))
                        if (typeof opt.minValue === 'number') optBuilder.setMinValue(opt.minValue)
                        if (typeof opt.maxValue === 'number') optBuilder.setMaxValue(opt.maxValue)
                        if (typeof opt.autocomplete === 'boolean') optBuilder.setAutocomplete(opt.autocomplete)

                        builder.addNumberOption(optBuilder)
                    } else if (opt.type === ApplicationCommandOptionType.Channel) {
                        const optBuilder = new SlashCommandChannelOption()
                            .setName(name)
                            .setNameLocalizations(localizedNames)
                            .setDescription(description)
                            .setDescriptionLocalizations(localizedDescriptions)

                        if (typeof opt.required === 'boolean') optBuilder.setRequired(opt.required)
                        if (Array.isArray(opt.channelTypes)) optBuilder.addChannelTypes(...opt.channelTypes)

                        builder.addChannelOption(optBuilder)
                    } else {
                        let addFn:
                                | typeof builder.addBooleanOption
                                | typeof builder.addUserOption
                                | typeof builder.addRoleOption
                                | typeof builder.addMentionableOption
                                | typeof builder.addAttachmentOption,
                            optionBuilder:
                                | SlashCommandBooleanOption
                                | SlashCommandUserOption
                                | SlashCommandRoleOption
                                | SlashCommandMentionableOption
                                | SlashCommandAttachmentOption

                        switch (opt.type) {
                            case ApplicationCommandOptionType.Boolean:
                                addFn = builder.addBooleanOption.bind(builder)
                                optionBuilder = new SlashCommandBooleanOption()
                                break
                            case ApplicationCommandOptionType.User:
                                addFn = builder.addUserOption.bind(builder)
                                optionBuilder = new SlashCommandUserOption()
                                break
                            case ApplicationCommandOptionType.Role:
                                addFn = builder.addRoleOption.bind(builder)
                                optionBuilder = new SlashCommandRoleOption()
                                break
                            case ApplicationCommandOptionType.Mentionable:
                                addFn = builder.addMentionableOption.bind(builder)
                                optionBuilder = new SlashCommandMentionableOption()
                                break
                            case ApplicationCommandOptionType.Attachment:
                                addFn = builder.addAttachmentOption.bind(builder)
                                optionBuilder = new SlashCommandAttachmentOption()
                                break
                        }

                        addFn(
                            optionBuilder
                                .setName(name)
                                .setNameLocalizations(localizedNames)
                                .setDescription(description)
                                .setDescriptionLocalizations(localizedDescriptions)
                                .setRequired(opt.required) as any
                        )
                    }
                }

                if (option.type === ApplicationCommandOptionType.Subcommand) {
                    const subcommandBuilder = new SlashCommandSubcommandBuilder()
                        .setName(option.name)
                        .setDescription(truncateString(tEn(option.description)))
                        .setDescriptionLocalizations({
                            ru: truncateString(tRu(option.description)),
                            uk: truncateString(tUk(option.description)),
                            fr: truncateString(tFr(option.description)),
                            de: truncateString(tDe(option.description)),
                            pl: truncateString(tPl(option.description))
                        })

                    for (const opt of option.options) {
                        buildOptions(subcommandBuilder, opt)
                    }

                    slashCommand.addSubcommand(subcommandBuilder)
                } else if (option.type === ApplicationCommandOptionType.SubcommandGroup) {
                } else {
                    buildOptions(slashCommand, option)
                }
            }

            return { ...slashCommand.toJSON(), integration_types: command.integrationTypes, contexts: command.contexts }
        } else if (type === CommandBuildJSONType.UserContextMenu || type === CommandBuildJSONType.MessageContextMenu) {
            const contextMenuCommand = new ContextMenuCommandBuilder()
                .setType(type === CommandBuildJSONType.UserContextMenu ? ApplicationCommandType.User : ApplicationCommandType.Message)
                .setName(truncateString(tEn(command.prettyName), 32))
                .setNameLocalizations({
                    ru: truncateString(tRu(command.prettyName), 32),
                    uk: truncateString(tUk(command.prettyName), 32),
                    fr: truncateString(tFr(command.prettyName), 32),
                    de: truncateString(tDe(command.prettyName), 32),
                    pl: truncateString(tPl(command.prettyName), 32)
                })
                .setDefaultMemberPermissions(command.defaultMemberPermissions)

            return { ...contextMenuCommand.toJSON(), integration_types: command.integrationTypes, contexts: command.contexts }
        }
    }
}

export enum CommandGroup {
    General,
    Moderation,
    Music,
    Utility
}

export enum CommandIntegrationTypes {
    GuildInstall,
    UserInstall
}

export enum CommandContexts {
    Guild,
    BotDM,
    PrivateChannel
}

export type CommandSlashFn = (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) => Promise<boolean>
export type CommandUserFn = (self: Lacuna, server: ServerDocument, interaction: UserContextMenuCommandInteraction<'cached'>) => Promise<boolean>
export type CommandMessageFn = (self: Lacuna, server: ServerDocument, interaction: MessageContextMenuCommandInteraction<'cached'>) => Promise<boolean>

export interface CommandOptions {
    prettyName?: string
    description: string
    group: CommandGroup
    options?: CommandOption[]
    defaultMemberPermissions?: PermissionsString[]
    selfPermissions?: PermissionsString[]
    nsfw?: boolean
    integrationTypes?: CommandIntegrationTypes[]
    contexts?: CommandContexts[]
    premium?: boolean
    private?: boolean
    slashFn?: CommandSlashFn
    userFn?: CommandUserFn
    messageFn?: CommandMessageFn
    subcommandFns?: Record<string, CommandSlashFn>
}

export type CommandOption =
    | CommandSubcommandOption
    | CommandSubcommandGroupOption
    | CommandStringOption
    | CommandNumericOption
    | CommandBooleanOption
    | CommandUserOption
    | CommandChannelOption
    | CommandRoleOption
    | CommandMentionableOption
    | CommandAttachmentOption

export interface BaseCommandOption {
    type: ApplicationCommandOptionType
    name: string
    description: string
    required?: boolean
}

export interface CommandSubcommandOption extends Omit<BaseCommandOption, 'required'> {
    type: ApplicationCommandOptionType.Subcommand
    options: Exclude<CommandOption, CommandSubcommandOption | CommandSubcommandGroupOption>[]
}

export interface CommandSubcommandGroupOption extends Omit<BaseCommandOption, 'required'> {
    type: ApplicationCommandOptionType.SubcommandGroup
    options?: CommandSubcommandOption[]
}

export interface CommandStringOption extends BaseCommandOption {
    type: ApplicationCommandOptionType.String
    choices?: CommandStringOptionChoice[]
    maxLength?: number
    minLength?: number
    autocomplete?: boolean
}

export interface CommandStringOptionChoice {
    name: string
    value: string
}

export interface CommandNumericOption extends BaseCommandOption {
    type: ApplicationCommandOptionType.Integer | ApplicationCommandOptionType.Number
    choices?: CommandNumericOptionChoice[]
    maxValue?: number
    minValue?: number
    autocomplete?: boolean
}

export interface CommandNumericOptionChoice {
    name: string
    value: number
}

export interface CommandBooleanOption extends BaseCommandOption {
    type: ApplicationCommandOptionType.Boolean
}

export interface CommandUserOption extends BaseCommandOption {
    type: ApplicationCommandOptionType.User
}

export interface CommandChannelOption extends BaseCommandOption {
    type: ApplicationCommandOptionType.Channel
    channelTypes: ApplicationCommandOptionAllowedChannelTypes[]
}

export interface CommandRoleOption extends BaseCommandOption {
    type: ApplicationCommandOptionType.Role
}

export interface CommandMentionableOption extends BaseCommandOption {
    type: ApplicationCommandOptionType.Mentionable
}

export interface CommandAttachmentOption extends BaseCommandOption {
    type: ApplicationCommandOptionType.Attachment
}

export type CommandInteraction =
    | ChatInputCommandInteraction<'cached'>
    | UserContextMenuCommandInteraction<'cached'>
    | MessageContextMenuCommandInteraction<'cached'>

export enum CommandBuildJSONType {
    Slash,
    UserContextMenu,
    MessageContextMenu
}
