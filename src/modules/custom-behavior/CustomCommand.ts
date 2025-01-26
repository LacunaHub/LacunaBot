import {
    ServerDocument,
    ServerModulesCustomCommand,
    ServerModulesCustomCommandOptions,
    ServerModulesCustomCommandScript,
    ServerModulesCustomCommandScriptLanguages
} from '@lacunahub/lacuna-database-driver'
import { ApplicationCommandOptionType, BaseGuildTextChannel, ChatInputCommandInteraction, Team } from 'discord.js'
import { Context, Isolate } from 'isolated-vm'
import { Database as QDatabase } from 'quickmongo'
import {
    convertComponentsToScript,
    extendStorage,
    runScript,
    serializeChannel,
    serializeGuild,
    serializeMember,
    serializeRole,
    serializeUser
} from '.'
import Lacuna from '../../internals/Lacuna'
import logger from '../../internals/Logger'

export default class CustomCommand {
    public command: ServerModulesCustomCommand
    public self: Lacuna
    public server: ServerDocument
    public interaction: ChatInputCommandInteraction<'cached'>
    public storage: QDatabase
    public usedPatterns: string[]
    public usedFunctions: string[]
    public isolate: Isolate

    constructor(command: ServerModulesCustomCommand, self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) {
        this.command = command

        this.self = self

        this.server = server

        this.interaction = interaction

        this.storage = new this.self.db.qdb.table('public-storage')

        const isolateState =
            this.self.isolates.get(interaction.guildId) ??
            this.self.isolates
                .set(interaction.guildId, {
                    value: new Isolate({
                        memoryLimit: 8,
                        onCatastrophicError(message) {
                            logger.error('(Catastrophic Error):', message)
                            logger.telegram.error('Catastrophic Error:', message)
                        }
                    }),
                    lastUsed: Date.now()
                })
                .get(interaction.guildId)

        isolateState.lastUsed = Date.now()
        this.isolate = isolateState.value

        this.usedPatterns = []

        this.usedFunctions = []
    }

    public async getGlobalValues() {
        const { channel, commandId, commandName, guild, member, options } = this.interaction

        return {
            channel: channel ? serializeChannel(channel) : undefined,
            command: {
                id: commandId,
                name: commandName,
                options: options.data.map(i => {
                    let user, channel, role

                    if (i.type === ApplicationCommandOptionType.User) user = options.getUser(i.name)
                    if (i.type === ApplicationCommandOptionType.Channel) channel = options.getChannel(i.name)
                    if (i.type === ApplicationCommandOptionType.Role) role = options.getRole(i.name)

                    return {
                        channel: channel ? serializeChannel(channel) : undefined,
                        name: i.name,
                        role: role ? serializeRole(role) : undefined,
                        user: user ? serializeUser(user) : undefined,
                        value: i.value
                    }
                })
            },
            guild: serializeGuild(guild),
            member: member ? serializeMember(member) : undefined
        }
    }

    public async execute() {
        const t = this.self.i18n.t.bind(null, this.server.locale)
        const throttled = await this.throttled()

        if (throttled.status) {
            await this.interaction.reply({
                content: `${this.self.staticEmojis.Cross} | ${t('Commands.CommandThrottling', {
                    username: `**${this.interaction.user.username}**`,
                    time: `<t:${Math.round(throttled.retry_after / 1000)}:T>`
                })}`,
                ephemeral: true
            })

            return false
        }

        const ctx = await this.isolate.createContext()
        ctx.global.setSync('global', ctx.global.derefInto())

        const globalValues = await this.getGlobalValues()

        for (const smartValue of Object.keys(globalValues)) {
            ctx.global.setSync(smartValue, globalValues[smartValue], { copy: true })
        }

        extendStorage(this, ctx, this.server._id)

        if ('scripts' in this.command) await this.executeScripts(ctx, this.command.scripts)
        else if ('components' in this.command) {
            const script = convertComponentsToScript(this.command.components)
            await this.executeScripts(ctx, [{ name: null, language: 1, code: script }])
        }

        await this.throttle()

        this.self.logger.telegram.info(
            `Code Snippets (${this.interaction.guildId}:${this.interaction.user.id}):\n\`\`\`\n${this.usedPatterns.join('\n\n')}\n\`\`\``
        )
        this.self.emit('commandExecution', {
            command: this.interaction.commandName,
            options: this.interaction.options.data.map(i => ({ name: i.name, type: i.type, value: i.value ?? null })),
            guild: { name: this.interaction.guild.name, id: this.interaction.guildId },
            channel: { name: (this.interaction.channel as BaseGuildTextChannel)?.name, id: this.interaction.channelId },
            user: { name: this.interaction.user.username, id: this.interaction.user.id }
        })

        ctx.release()

        return true
    }

    private async executeScripts(ctx: Context, scripts: ServerModulesCustomCommandScript[]) {
        scripts = scripts
            .filter(v => v.language === ServerModulesCustomCommandScriptLanguages.JavaScript && v.code.length > 0)
            .slice(0, this.server.premium.available ? 10 : 1)
        const maxScriptLength = this.server.premium.available ? 20_000 : 2000

        for (const script of scripts) {
            try {
                await runScript(this, ctx, script.code, { throwError: true, maxScriptLength })
            } catch (err) {
                break
            }
        }
    }

    private async throttled() {
        if (this.command.options.includes(ServerModulesCustomCommandOptions.Throttling)) {
            let path = `${this.interaction.guildId}.users.${this.interaction.user.id}`

            if (this.command.throttling?.type === 'PER_GUILD') {
                path = `${this.interaction.guildId}.guild`
            }

            if (this.command.throttling?.type === 'PER_CHANNEL') {
                path = `${this.interaction.guildId}.channels.${this.interaction.channelId}`
            }

            const throttled = (await this.self.db.qdb.get(`throttling.customCommands.${this.command.id}.${path}`)) as any

            if (throttled?.retry_after - Date.now() > 0) {
                return {
                    status: true,
                    retry_after: throttled.retry_after
                }
            }

            if (throttled?.remaining === -1) {
                await this.self.db.qdb.delete(`throttling.customCommands.${this.command.id}.${path}`)
            }

            return {
                status: false
            }
        }

        return {
            status: false
        }
    }

    private async throttle() {
        if ((this.self.application.owner as Team).members.some(m => m.id === this.interaction.user.id)) return false

        if (this.command.options.includes(ServerModulesCustomCommandOptions.Throttling)) {
            let path = `${this.interaction.guildId}.users.${this.interaction.user.id}`

            if (this.command.throttling?.type === 'PER_GUILD') {
                path = `${this.interaction.guildId}.guild`
            }

            if (this.command.throttling?.type === 'PER_CHANNEL') {
                path = `${this.interaction.guildId}.channels.${this.interaction.channelId}`
            }

            let throttled = (await this.self.db.qdb.get(`throttling.customCommands.${this.command.id}.${path}`)) as any
            if (!throttled) {
                await this.self.db.qdb.set(`throttling.customCommands.${this.command.id}.${path}`, {
                    retry_after: Date.now(),
                    remaining: this.command.throttling.max_uses
                })

                throttled = (await this.self.db.qdb.get(`throttling.customCommands.${this.command.id}.${path}`)) as any
            }

            this.self.db.qdb.sub(`throttling.customCommands.${this.command.id}.${path}.remaining`, 1)
            throttled.remaining--

            if (throttled.remaining <= 0) {
                await this.self.db.qdb.set(
                    `throttling.customCommands.${this.command.id}.${path}.retry_after`,
                    Date.now() + this.command.throttling.timeout * 1000
                )
                await this.self.db.qdb.set(`throttling.customCommands.${this.command.id}.${path}.remaining`, -1)
            }
        } else {
            const has = await this.self.db.qdb.has(`throttling.customCommands.${this.command.id}.${this.interaction.guildId}`)

            if (has) {
                await this.self.db.qdb.delete(`throttling.customCommands.${this.command.id}.${this.interaction.guildId}`)
            }
        }
    }

    public useFunction(name: string) {
        this.usedFunctions.push(name)
        return this.usedFunctions.filter(i => i === name).length
    }
}
