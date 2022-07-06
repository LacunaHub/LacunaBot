import { Client, ClientOptions, Collection, PermissionFlags, Permissions, Util } from 'discord.js'
import { Manager } from 'erela.js'
import { readdirSync } from 'fs'
import { connect } from 'mongoose'
import qdb from 'quick.db'
import db from '../database'
import i18n from '../i18n'
import Utils from '../internals/utility/Utils'
import locale from './locale'
import logger from './Logger'
import Command, { CommandOptions } from './structures/Command'
import Event, { EventOptions } from './structures/Event'
import Giveaway, { handleEntries as handleGiveawayEntries } from './structures/Giveaway'
import TemporaryBan, { handleEntries as handleTemporaryBanEntries } from './structures/TemporaryBan'
import TemporaryRole, { handleEntries as handleTemporaryRoleEntries } from './structures/TemporaryRole'

export default class Lacuna extends Client {
    public logger: typeof logger
    public db: typeof db
    public qdb: typeof qdb
    public commands: Collection<string, Command>
    public events: Collection<string, Event>
    public player: Manager
    public giveaways: Collection<string, Giveaway>
    public tempbans: Collection<string, TemporaryBan>
    public temproles: Collection<string, TemporaryRole>
    public translator: typeof locale
    public i18n: typeof i18n
    public utils: typeof Utils
    public PERMISSIONS_FLAGS: PermissionFlags

    constructor(options?: ClientOptions) {
        super(options)

        this.logger = logger

        this.db = db

        this.qdb = qdb

        this.commands = new Collection()

        this.events = new Collection()

        this.player = null

        this.giveaways = new Collection()

        this.tempbans = new Collection()

        this.temproles = new Collection()

        this.translator = locale

        this.i18n = i18n

        this.utils = Utils

        this.PERMISSIONS_FLAGS = Permissions.FLAGS

        this.start()
    }

    get _emojis() {
        const OK = '<:OK:905724948453134349>'
        const ERROR = '<:ERROR:905724969827315732>'
        const DIAMOND = '<:DIAMOND:905707582042288178>'

        return {
            OK,
            ERROR,
            DIAMOND,
            details: {
                OK: Util.parseEmoji(OK),
                ERROR: Util.parseEmoji(ERROR),
                DIAMOND: Util.parseEmoji(DIAMOND)
            }
        }
    }

    get playerNodesStats() {
        const nodes = this.player?.nodes

        return (
            nodes?.map(node => {
                return {
                    id: node.options.identifier,
                    connected: node.connected,
                    cpu_load: Number(node.stats.cpu.lavalinkLoad.toFixed(2)),
                    memory_usage: Math.round((node.stats.memory.used * 100) / node.stats.memory.reservable),
                    uptime: node.stats.uptime,
                    players: {
                        playing: node.stats.playingPlayers,
                        total: node.stats.players
                    }
                }
            }) ?? []
        )
    }

    async start(): Promise<number> {
        await connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })

        await this.login(process.env.CLIENT_TOKEN)

        await this.loadEvents(true)

        this.application = await this.application.fetch()

        handleGiveawayEntries(this)
        handleTemporaryBanEntries(this)
        handleTemporaryRoleEntries(this)

        process.on('unhandledRejection', error => {
            const err = (error as any)?.stack ?? (error as any).message

            this.logger.error('(Unhandled Rejection)', err)

            if (typeof err === 'string' && !err.includes('DiscordAPIError')) {
                this.logger.telegram.error('`Unhandled Rejection`', `\`\`\`\n${err}\n\`\`\``)
            }
        })

        return Date.now()
    }

    async updateApplicationCommands(guild_id: string, language: string) {
        const t = this.i18n.t.bind(null, language)

        const slash = this.commands
            .filter(c => c.is_slash_command)
            .map(command => {
                return {
                    name: command.name,
                    description: t(command.description),
                    type: 'CHAT_INPUT',
                    options:
                        command.options?.map(option => {
                            if (option.type == 'SUB_COMMAND')
                                return {
                                    ...option,
                                    description: t(option.description),
                                    options:
                                        option.options?.map(opt => {
                                            return {
                                                ...opt,
                                                name: t(opt.name),
                                                description: t(opt.description),
                                                choices:
                                                    option.choices?.map(choice => {
                                                        return { ...choice, name: t(choice.name) }
                                                    }) ?? null
                                            }
                                        }) ?? []
                                }

                            return {
                                ...option,
                                name: t(option.name),
                                description: t(option.description),
                                choices:
                                    option.choices?.map(choice => {
                                        return { ...choice, name: t(choice.name) }
                                    }) ?? null
                            }
                        }) ?? []
                }
            })

        const context = this.commands
            .filter(i => i.is_user_command || i.is_message_command)
            .map(command => {
                return {
                    name: t(command.pretty_name),
                    type: command.is_user_command ? 'USER' : 'MESSAGE'
                }
            })

        const commands = [...slash, ...context]

        return await this.application.commands.set(commands as any, guild_id)
    }

    loadCommands() {
        const directories: string[] = readdirSync('./dist/commands', { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)

        let amount: number = 0

        for (const directory of directories) {
            const dirs: string[] = readdirSync(`./dist/commands/${directory}`, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name)

            for (const dir of dirs) {
                const command: CommandOptions = require(`../commands/${directory}/${dir}`).default

                new Command(this, command)

                delete require.cache[require.resolve(`../commands/${directory}/${dir}`)]
            }

            amount += dirs.length
        }

        this.logger.info(`(Commands): Loaded ${amount} commands from ${directories.length} categories`)
    }

    loadEvents(initial = false) {
        const directories: string[] = readdirSync('./dist/events', { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)

        let amount = 0,
            total = 0

        for (const directory of directories) {
            const files: string[] = readdirSync(`./dist/events/${directory}`, { withFileTypes: true })
                .filter(dirent => dirent.isFile() && dirent.name.endsWith('.js'))
                .map(dirent => dirent.name)

            let events: EventOptions[] = files.map(file => require(`../events/${directory}/${file}`).default)
            events = events.filter(e => Boolean(e.initial) == initial)

            for (const event of events) new Event(this, event)

            for (const file of files) delete require.cache[require.resolve(`../events/${directory}/${file}`)]

            amount += events.length
            total += files.length
        }

        this.logger.info(`(Events): Loaded ${amount} events of ${total}`)
    }
}
