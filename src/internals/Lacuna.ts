import { connect } from 'mongoose'
import { readdirSync } from 'fs'
import { Client, ClientOptions, Collection, PermissionFlags, Permissions, Util } from 'discord.js'
import { Manager } from 'erela.js'
import Command, { CommandOptions } from './structures/Command'
import Event, { EventOptions } from './structures/Event'
import logger from './Logger'
import db from '../database'
import qdb from 'quick.db'
import Utils from '../internals/utility/Utils'

import Giveaway, { handleEntries as handleGiveawayEntries } from './structures/Giveaway'
import TemporaryBan, { handleEntries as handleTemporaryBanEntries } from './structures/TemporaryBan'
import TemporaryMute, { handleEntries as handleTemporaryMuteEntries } from './structures/TemporaryMute'
import TemporaryRole, { handleEntries as handleTemporaryRoleEntries } from './structures/TemporaryRole'

import locale from './locale'
import { checkVoiceStates } from '../modules/Levels'
import { Twitch } from '../modules/Twitch'
import { scheduleCheck as scheduleYouTubeCheck } from '../modules/YouTube'

export default class Lacuna extends Client {
    public logger: typeof logger
    public db: typeof db
    public qdb: typeof qdb
    public commands: Collection<string, Command>
    public events: Collection<string, Event>
    public player: Manager
    public giveaways: Collection<string, Giveaway>
    public tempbans: Collection<string, TemporaryBan>
    public tempmutes: Collection<string, TemporaryMute>
    public temproles: Collection<string, TemporaryRole>
    public twitchChannels: Collection<string, Twitch>
    public translator: typeof locale
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

        this.tempmutes = new Collection()

        this.temproles = new Collection()

        this.twitchChannels = new Collection()

        this.translator = locale

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

        return nodes?.map(node => {
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
    }

    async start(): Promise<number> {
        await connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })

        await this.login(process.env.CLIENT_TOKEN)

        await this.loadEvents(true)

        this.application = await this.application.fetch()

        await handleGiveawayEntries(this)
        await handleTemporaryBanEntries(this)
        await handleTemporaryMuteEntries(this)
        await handleTemporaryRoleEntries(this)
        
        checkVoiceStates(this)
        scheduleYouTubeCheck(this)

        process.on('unhandledRejection', error => {
            const err = (error as any)?.stack ?? (error as any).message

            this.logger.error('(Unhandled Rejection)', err)

            if (typeof err === 'string' && !err.includes('DiscordAPIError')) {
                this.logger.telegram.error('`Unhandled Rejection`', `\`\`\`\n${err}\n\`\`\``)
            }
        })

        return Date.now()
    }

    async registerSlashCommands(guild_id: string, language: string) {
        const locale = this.translator.locale(language)

        const slash = this.commands.filter(c => c.is_slash_command).map(c => {
            return {
                name: c.name,
                description: this.utils.resolveObjectPath(c.description, locale),
                type: 'CHAT_INPUT',
                options: c?.options?.map(option => {
                    if (option.type == 'SUB_COMMAND') return {
                        ...option,
                        description: this.utils.resolveObjectPath(option.description, locale),
                        options: option.options.map(o => {
                            return {
                                ...o,
                                name: this.utils.resolveObjectPath(o.name, locale),
                                description: this.utils.resolveObjectPath(o.description, locale)
                            }
                        })
                    }

                    return {
                        ...option,
                        name: this.utils.resolveObjectPath(option.name, locale),
                        description: this.utils.resolveObjectPath(option.description, locale)
                    }
                }) ?? []
            }
        })

        const message = this.commands.filter(c => c.is_message_command).map(c => {
            return {
                name: this.utils.resolveObjectPath(c.pretty_name, locale),
                type: 'MESSAGE'
            }
        })

        const user = this.commands.filter(c => c.is_user_command).map(c => {
            return {
                name: this.utils.resolveObjectPath(c.pretty_name, locale),
                type: 'USER'
            }
        })

        const commands = [ ...slash, ...message, ...user ]

        return await this.application.commands.set(commands as any, guild_id)
    }

    loadCommands() {
        const directories: string[] = readdirSync('./dist/commands', { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name)

        let amount: number = 0

        for (const directory of directories) {
            const dirs: string[] = readdirSync(`./dist/commands/${directory}`, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name)

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
        const directories: string[] = readdirSync('./dist/events', { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name)

        let amount = 0, total = 0

        for (const directory of directories) {
            const files: string[] = readdirSync(`./dist/events/${directory}`, { withFileTypes: true }).filter(dirent => dirent.isFile() && dirent.name.endsWith('.js')).map(dirent => dirent.name)

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