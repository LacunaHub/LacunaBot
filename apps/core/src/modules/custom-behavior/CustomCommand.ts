import {
    type ServerDocument,
    type ServerModulesCustomCommand,
    ServerModulesCustomCommandOptions,
    type ServerModulesCustomCommandScript,
    ServerModulesCustomCommandScriptLanguages
} from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import Logger from '@/utility/Logger.js'
import { ApplicationCommandOptionType, BaseGuildTextChannel, ChatInputCommandInteraction } from 'discord.js'
import IVM from 'isolated-vm'
import { Database as QDatabase } from 'quickmongo'
import {
    extendStorage,
    runScript,
    serializeChannel,
    serializeGuild,
    serializeMember,
    serializeRole,
    serializeUser
} from './index.js'

export default class CustomCommand {
    public command: ServerModulesCustomCommand
    public self: Lacuna
    public server: ServerDocument
    public interaction: ChatInputCommandInteraction<'cached'>
    public storage: QDatabase
    public usedPatterns: string[]
    public usedFunctions: string[]
    public isolate: IVM.Isolate

    constructor(
        command: ServerModulesCustomCommand,
        self: Lacuna,
        server: ServerDocument,
        interaction: ChatInputCommandInteraction<'cached'>
    ) {
        this.command = command

        this.self = self

        this.server = server

        this.interaction = interaction

        this.storage = new this.self.db.qdb.table('public-storage')

        const isolateState =
            this.self.isolates.get(interaction.guildId) ??
            this.self.isolates
                .set(interaction.guildId, {
                    value: new IVM.Isolate({
                        memoryLimit: 8,
                        onCatastrophicError: message => Logger.error({ message }, 'ivm catastrophic error')
                    }),
                    lastUsed: Date.now()
                })
                .get(interaction.guildId)!

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
                    let userOpt, channelOpt, roleOpt

                    if (i.type === ApplicationCommandOptionType.User) userOpt = options.getUser(i.name)
                    if (i.type === ApplicationCommandOptionType.Channel) channelOpt = options.getChannel(i.name)
                    if (i.type === ApplicationCommandOptionType.Role) roleOpt = options.getRole(i.name)

                    return {
                        channel: channelOpt ? serializeChannel(channelOpt as any) : undefined,
                        name: i.name,
                        role: roleOpt ? serializeRole(roleOpt) : undefined,
                        user: userOpt ? serializeUser(userOpt) : undefined,
                        value: i.value
                    }
                })
            },
            guild: serializeGuild(guild),
            member: member ? serializeMember(member) : undefined
        }
    }

    public async execute() {
        if ('components' in this.command) return false

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
            ctx.global.setSync(smartValue, (globalValues as any)[smartValue], { copy: true })
        }

        extendStorage(this, ctx, this.server._id)

        if ('scripts' in this.command) await this.executeScripts(ctx, this.command.scripts)

        await this.throttle()

        this.self.logger.info(
            { guildId: this.interaction.guildId, userId: this.interaction.user.id, usedPatterns: this.usedPatterns },
            'custom command execution'
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

    private async executeScripts(ctx: IVM.Context, scripts: ServerModulesCustomCommandScript[]) {
        scripts = scripts
            .filter(v => v.language === ServerModulesCustomCommandScriptLanguages.JavaScript && v.code.length > 0)
            .slice(0, 10)
        const maxScriptLength = 20_000

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

            const throttled = (await this.self.db.qdb.get(
                `throttling.customCommands.${this.command.id}.${path}`
            )) as any

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
                    remaining: Number(this.command.throttling?.max_uses)
                })

                throttled = (await this.self.db.qdb.get(`throttling.customCommands.${this.command.id}.${path}`)) as any
            }

            this.self.db.qdb.sub(`throttling.customCommands.${this.command.id}.${path}.remaining`, 1)
            throttled.remaining--

            if (throttled.remaining <= 0) {
                await this.self.db.qdb.set(
                    `throttling.customCommands.${this.command.id}.${path}.retry_after`,
                    Date.now() + Number(this.command.throttling?.timeout) * 1000
                )
                await this.self.db.qdb.set(`throttling.customCommands.${this.command.id}.${path}.remaining`, -1)
            }
        } else {
            const has = await this.self.db.qdb.has(
                `throttling.customCommands.${this.command.id}.${this.interaction.guildId}`
            )

            if (has) {
                await this.self.db.qdb.delete(
                    `throttling.customCommands.${this.command.id}.${this.interaction.guildId}`
                )
            }
        }
    }

    public useFunction(name: string) {
        this.usedFunctions.push(name)
        return this.usedFunctions.filter(i => i === name).length
    }
}
