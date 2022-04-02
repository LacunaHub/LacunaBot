import Lacuna from '../Lacuna'
import { ServerDocument, SystemCommand } from '../../database/schemas/Servers'
import { CommandInteraction, ContextMenuInteraction, Message, ApplicationCommandOptionData, PermissionResolvable, Team, GuildMember, BaseGuildTextChannel } from 'discord.js'

export default class Command {
    public self: Lacuna
    public prefix: CommandOptions['prefix']
    public slash: CommandOptions['slash']
    public user: CommandOptions['user']
    public message: CommandOptions['message']
    public name: string
    public pretty_name?: string
    public description: string
    public type: CommandOptions['type']
    public options: CommandOption[]
    public default_permission: boolean
    public group: CommandOptions['group']
    public is_prefix_command: boolean
    public is_slash_command: boolean
    public is_user_command: boolean
    public is_message_command: boolean
    public subcommands?: CommandOptions['subcommands']
    public uses: number
    public premium_only: boolean
    public private: boolean
    public throttling: CommandThrottlingOptions
    public throttles: Map<string, CommandThrottledUser>
    public permissions: CommandOptions['permissions']

    constructor(self: Lacuna, options: CommandOptions) {
        this.self = self

        this.prefix = options.prefix

        this.slash = options.slash

        this.user = options.user

        this.message = options.message

        this.name = options.name

        this.pretty_name = options.pretty_name ?? null

        this.description = options.description

        this.type = options.type

        this.options = options.options

        this.default_permission = Boolean(options.default_permission)

        this.group = options.group ?? 'GENERAL'

        this.is_prefix_command = Boolean(options.prefix)

        this.is_slash_command = Boolean(options.slash)

        this.is_user_command = Boolean(options.user)

        this.is_message_command = Boolean(options.message)

        this.subcommands = options.subcommands ?? []

        this.uses = 0

        this.premium_only = Boolean(options.premium_only)

        this.private = Boolean(options.private)

        this.throttling = options.throttling ?? null

        this.throttles = options.throttling ? new Map() : null

        this.permissions = {
            self: options.permissions?.self ?? [],
            user: options.permissions?.user ?? []
        }

        this.self.commands.set(this.name, this)
    }

    denied(server: ServerDocument, signal: CommandInteraction | ContextMenuInteraction | Message): boolean {
        const command: SystemCommand = server.commands.system.find(c => c.name == this.name)

        if ((this.self.application.owner as Team).members.some(m => m.id == (signal.member as GuildMember).id)) return true

        if (this.private) return false

        if (command) {
            if (command.inactive) return false

            if (command.blocked.channels.includes(signal.channel.id)) return false

            if (command.allowed.channels.length && !command.allowed.channels.includes(signal.channel.id)) return false

            if ((signal.member as GuildMember).roles.cache.some(r => command.blocked.roles.includes(r.id))) return false
        }

        return true
    }

    allowed(server: ServerDocument, signal: CommandInteraction | ContextMenuInteraction | Message): boolean {
        const command: SystemCommand = server.commands.system.find(c => c.name == this.name)

        if ((this.self.application.owner as Team).members.some(m => m.id == (signal.member as GuildMember).id)) return true

        if (command) {
            if (command.allowed.roles.length && (signal.member as GuildMember).roles.cache.some(r => command.allowed.roles.includes(r.id))) return true

            if (!command.allowed.roles.length && !this.permissions.user.length) return true
        }

        if (!command && !this.permissions.user.length) return true

        if (this.permissions.user.length && (signal.member as GuildMember).permissions.has(this.permissions.user as any)) return true

        return false
    }

    async executeSlash(server: ServerDocument, interaction: CommandInteraction): Promise<boolean> {
        const locale = this.self.translator.locale(server.locale)

        const denied: boolean = this.denied(server, interaction), allowed: boolean = this.allowed(server, interaction)

        if (!denied || !allowed) {
            await interaction.reply({ content: `${this.self._emojis.ERROR} | ${this.self.translator.format(locale.commands.common.texts.command_denied, `**${interaction.user.tag}**`)}`, ephemeral: true })

            return false
        }

        if (this.premium_only && !server.server.premium.available) {
            await interaction.reply({ content: `${this.self._emojis.ERROR} | ${this.self.translator.format(locale.commands.common.texts.premium_only, `**${interaction.user.tag}**`)}`, ephemeral: true })

            return false
        }

        this.uses++

        const sc: string = this.subcommands.length ? interaction.options?.getSubcommand() : null
        const subcommand: CommandSubcommand = this.subcommands?.find(s => s.name == sc)

        if (subcommand) await subcommand.slash(this.self, server, interaction)
        else await this.slash(this.self, server, interaction)

        this.self.emit('commandExecution', {
            command: subcommand ? `${this.name} ${subcommand.name}` : this.name,
            guild: { name: interaction.guild.name, id: interaction.guild.id },
            channel: { name: (interaction.channel as BaseGuildTextChannel)?.name, id: interaction.channelId },
            user: { name: interaction.user.username, id: interaction.user.id }
        })

        return true
    }

    async executeContext(server: ServerDocument, interaction: ContextMenuInteraction): Promise<boolean> {
        const locale = this.self.translator.locale(server.locale)

        const denied: boolean = this.denied(server, interaction), allowed: boolean = this.allowed(server, interaction)

        if (!denied || !allowed) {
            await interaction.reply({ content: `${this.self._emojis.ERROR} | ${this.self.translator.format(locale.commands.common.texts.command_denied, `**${interaction.user.tag}**`)}`, ephemeral: true })

            return false
        }

        if (this.premium_only && !server.server.premium.available) {
            await interaction.reply({ content: `${this.self._emojis.ERROR} | ${this.self.translator.format(locale.commands.common.texts.premium_only, `**${interaction.user.tag}**`)}`, ephemeral: true })

            return false
        }

        this.uses++

        if (interaction.targetType == 'MESSAGE') await this.message(this.self, server, interaction)
        if (interaction.targetType == 'USER') await this.user(this.self, server, interaction)

        this.self.emit('commandExecution', {
            command: this.name,
            guild: { name: interaction.guild.name, id: interaction.guild.id },
            channel: { name: (interaction.channel as BaseGuildTextChannel)?.name, id: interaction.channelId },
            user: { name: interaction.user.username, id: interaction.user.id }
        })

        return true
    }


    async executePrefix(server: ServerDocument, message: Message): Promise<boolean> {
        if (!message.content.startsWith(server.prefix) || !server.commands.prefix_commands) return false

        const locale = this.self.translator.locale(server.locale)

        const denied: boolean = this.denied(server, message), allowed: boolean = this.allowed(server, message)

        if (!denied || !allowed) return false

        if (this.permissions.self.length && !message.guild.me.permissions.has(this.permissions.self as any)) {
            const missing = (message.channel as BaseGuildTextChannel).permissionsFor(message.guild.me).missing(this.permissions.self as any)

            if (missing.includes('SEND_MESSAGES')) {
                await message.author.send({ content: `${this.self._emojis.ERROR} | ${this.self.translator.format(locale.commands.common.texts.missing_send_messages, `**${message.member.displayName}**`, `<#${message.channelId}>`)}` }).catch(() => {})

                return false
            }

            if (missing) {
                await message.reply({ content: `${this.self._emojis.ERROR} | ${this.self.translator.format(locale.commands.common.texts.missing_permissions, `**${message.member.displayName}**`, missing.map(p => `\`${locale.commands.common.permissions[p]?.toLowerCase()}\``).join(', '))}` })

                return false
            }
        }

        if (this.premium_only && !server.server.premium.available) {
            await message.reply({ content: `${this.self._emojis.ERROR} | ${this.self.translator.format(locale.commands.common.texts.premium_only, `**${message.author.tag}**`)}` })

            return false
        }

        this.uses++

        const subcommand: CommandSubcommand = this.subcommands?.find(sc => sc.name == message['args'][0])

        if (subcommand) {
            message['args'] = (message as any).args.slice(1)

            await subcommand.prefix(this.self, server, message)
        }

        else await this.prefix(this.self, server, message)
        
        this.self.emit('commandExecution', {
            command: subcommand ? `${this.name} ${subcommand.name}` : this.name,
            guild: { name: message.guild.name, id: message.guild.id },
            channel: { name: (message.channel as BaseGuildTextChannel).name, id: message.channelId },
            user: { name: message.author.username, id: message.author.id }
        })

        return true
    }
}

export interface CommandOptions {
    prefix(self: Lacuna, server: ServerDocument, message: Message): Promise<boolean>
    slash(self: Lacuna, server: ServerDocument, interaction: CommandInteraction): Promise<boolean>
    user(self: Lacuna, server: ServerDocument, interaction: ContextMenuInteraction): Promise<boolean>
    message(self: Lacuna, server: ServerDocument, interaction: ContextMenuInteraction): Promise<boolean>
    name: string
    pretty_name?: string
    description: string
    type: 'CHAT_INPUT' | 'USER' | 'MESSAGE'
    options: CommandOption[]
    default_permission: boolean
    group?: 'GENERAL' | 'MODERATION' | 'MUSIC' | 'UTILITY'
    subcommands?: CommandSubcommand[]
    premium_only: boolean
    private: boolean
    throttling?: CommandThrottlingOptions
    permissions: {
        self: string[]
        user: string[]
    }
}

export interface CommandOption {
    type: string
    name: string
    description: string
    required: boolean
    options?: CommandOption[]
    choices?: CommandOptionChoice[]
}

export interface CommandOptionChoice {
    name: string
    value: string | number
}

export interface CommandSubcommand {
    prefix(self: Lacuna, server: ServerDocument, message: Message): Promise<boolean>
    slash(self: Lacuna, server: ServerDocument, interaction: CommandInteraction): Promise<boolean>
    name: string
}

export interface CommandThrottlingOptions {
    usages: number
    duration: number
}

export interface CommandThrottledUser {
    usages: number
    throttled: boolean
    timeout: any
    expires: number
}