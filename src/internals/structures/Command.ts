import {
    ApplicationCommandOptionType,
    BaseGuildTextChannel,
    ChatInputCommandInteraction,
    ContextMenuCommandInteraction,
    GuildMember,
    Message,
    Team
} from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../Lacuna'

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

        this.permissions = {
            self: options.permissions?.self ?? [],
            user: options.permissions?.user ?? []
        }

        this.self.commands.set(this.name, this)
    }

    isExecutable(server: ServerDocument, signal: ChatInputCommandInteraction | ContextMenuCommandInteraction): boolean {
        const config = server.commands.configuration.find(i => i.name === this.name)

        if ((this.self.application.owner as Team).members.some(m => m.id == (signal.member as GuildMember).id)) return true

        if (this.private) return false

        if (config?.inactive) return false

        return true
    }

    async executeSlash(server: ServerDocument, interaction: ChatInputCommandInteraction): Promise<boolean> {
        const t = this.self.i18n.t.bind(null, server.locale)
        const executable: boolean = this.isExecutable(server, interaction)

        if (!executable) {
            await interaction.reply({
                content: `${this.self._emojis.ERROR} | ${t('common.command_denied', { user: `**${interaction.user.username}**` })}`,
                ephemeral: true
            })

            return false
        }

        if (this.premium_only && !server.server.premium.available) {
            await interaction.reply({
                content: `${this.self._emojis.ERROR} | ${t('common.command_premium_only', { user: `**${interaction.user.username}**` })}`,
                ephemeral: true
            })

            return false
        }

        const throttled = await this.throttled(server, interaction)

        if (throttled.status) {
            await interaction.reply({
                content: `${this.self._emojis.ERROR} | ${t('common.command_throttled', {
                    user: `**${interaction.user.username}**`,
                    time: `<t:${Math.round(throttled.retry_after / 1000)}:T>`
                })}`,
                ephemeral: true
            })

            return false
        }

        this.uses++

        const sc: string = this.subcommands.length ? interaction.options?.getSubcommand() : null
        const subcommand: CommandSubcommand = this.subcommands?.find(s => s.name == sc)

        if (subcommand) await subcommand.slash(this.self, server, interaction)
        else await this.slash(this.self, server, interaction)

        await this.throttle(server, interaction)

        this.self.emit('commandExecution', {
            command: this.name,
            subcommand: subcommand?.name ?? null,
            options:
                interaction.options?.data?.map(i => {
                    if (subcommand)
                        return {
                            name: i.name,
                            type: i.type,
                            value: i.value ?? null,
                            options: i.options.map(ii => ({ name: ii.name, type: ii.type, value: ii.value ?? null }))
                        }
                    else return { name: i.name, type: i.type, value: i.value ?? null }
                }) ?? [],
            guild: { name: interaction.guild.name, id: interaction.guild.id },
            channel: { name: (interaction.channel as BaseGuildTextChannel)?.name, id: interaction.channelId },
            user: { name: interaction.user.username, id: interaction.user.id }
        })

        return true
    }

    async executeContext(server: ServerDocument, interaction: ContextMenuCommandInteraction): Promise<boolean> {
        const t = this.self.i18n.t.bind(null, server.locale)
        const executable: boolean = this.isExecutable(server, interaction)

        if (!executable) {
            await interaction.reply({
                content: `${this.self._emojis.ERROR} | ${t('common.command_denied', { user: `**${interaction.user.tag}**` })}`,
                ephemeral: true
            })

            return false
        }

        if (this.premium_only && !server.server.premium.available) {
            await interaction.reply({
                content: `${this.self._emojis.ERROR} | ${t('common.command_premium_only', { user: `**${interaction.user.tag}**` })}`,
                ephemeral: true
            })

            return false
        }

        const throttled = await this.throttled(server, interaction)

        if (throttled.status) {
            await interaction.reply({
                content: `${this.self._emojis.ERROR} | ${t('common.command_throttled', {
                    user: `**${interaction.user.username}**`,
                    time: `<t:${Math.round(throttled.retry_after / 1000)}:T>`
                })}`,
                ephemeral: true
            })

            return false
        }

        this.uses++

        if (interaction.isMessageContextMenuCommand()) await this.message(this.self, server, interaction)
        if (interaction.isUserContextMenuCommand()) await this.user(this.self, server, interaction)

        await this.throttle(server, interaction)

        this.self.emit('commandExecution', {
            command: this.name,
            options: interaction.options.data.map(i => ({ name: i.name, type: i.type, value: i.value ?? null })),
            guild: { name: interaction.guild.name, id: interaction.guild.id },
            channel: { name: (interaction.channel as BaseGuildTextChannel)?.name, id: interaction.channelId },
            user: { name: interaction.user.username, id: interaction.user.id }
        })

        return true
    }

    async throttled(server: ServerDocument, interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction) {
        const config = server.commands.configuration.find(i => i.name === this.name)

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

    async throttle(server: ServerDocument, interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction) {
        const config = server.commands.configuration.find(i => i.name === this.name)

        if ((this.self.application.owner as Team).members.some(m => m.id === interaction.user.id)) return false

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
}

export interface CommandOptions {
    prefix(self: Lacuna, server: ServerDocument, message: Message): Promise<boolean>
    slash(self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction): Promise<boolean>
    user(self: Lacuna, server: ServerDocument, interaction: ContextMenuCommandInteraction): Promise<boolean>
    message(self: Lacuna, server: ServerDocument, interaction: ContextMenuCommandInteraction): Promise<boolean>
    name: string
    pretty_name?: string
    description: string
    type: ApplicationCommandOptionType
    options: CommandOption[]
    default_permission: boolean
    group?: 'GENERAL' | 'MODERATION' | 'MUSIC' | 'UTILITY'
    subcommands?: CommandSubcommand[]
    premium_only: boolean
    private: boolean
    permissions: {
        self: string[]
        user: string[]
    }
}

export interface CommandOption {
    type: ApplicationCommandOptionType
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
    slash(self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction): Promise<boolean>
    name: string
}
