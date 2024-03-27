import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { LavalunaManager } from '@lacunahub/lavaluna.js'
import { Shard as BridgeShard } from 'discord-cross-hosting'
import { ClusterClient } from 'discord-hybrid-sharding'
import { Client, ClientOptions, Collection, LimitedCollection, parseEmoji, PermissionsBitField } from 'discord.js'
import { readdirSync } from 'fs'
import { os } from 'node-os-utils'
import db from '../database'
import i18n from '../i18n'
import Utils from '../internals/utility/Utils'
import logger from './Logger'
import Command, { CommandOptions } from './structures/Command'
import Event, { EventOptions } from './structures/Event'
import Giveaway, { handleEntries as handleGiveawayEntries } from './structures/Giveaway'
import TemporaryBan, { handleEntries as handleTemporaryBanEntries } from './structures/TemporaryBan'
import TemporaryRole, { handleEntries as handleTemporaryRoleEntries } from './structures/TemporaryRole'

export default class Lacuna extends Client {
    public cluster: ClusterClient<Lacuna>
    public machine: BridgeShard
    public hostname: string
    public logger: typeof logger
    public db: typeof db
    public cache: LimitedCollection<string, any>
    public commands: Collection<string, Command>
    public events: Collection<string, Event>
    public lava: LavalunaManager | null = null
    public giveaways: Collection<string, Giveaway>
    public tempbans: Collection<string, TemporaryBan>
    public temproles: Collection<string, TemporaryRole>
    public i18n: typeof i18n
    public utils: typeof Utils
    public PermissionFlags: typeof PermissionsBitField.Flags

    constructor(options?: ClientOptions) {
        super(options)

        this.cluster = null

        this.machine = null

        this.hostname = os.hostname()

        this.logger = logger

        this.db = db

        this.cache = new LimitedCollection({ maxSize: 100 })

        this.commands = new Collection()

        this.events = new Collection()

        this.giveaways = new Collection()

        this.tempbans = new Collection()

        this.temproles = new Collection()

        this.i18n = i18n

        this.utils = Utils

        this.PermissionFlags = PermissionsBitField.Flags

        this.start()
    }

    get _emojis() {
        const OK = '<:OK:905724948453134349>'
        const ERROR = '<:ERROR:905724969827315732>'
        const DIAMOND = '<:DIAMOND:905707582042288178>'
        const SPOTIFY = '<:SPOTIFY:1056946964543066112>'
        const YANDEXMUSIC = '<:YANDEXMUSIC:1056946926110638090>'
        const SOUNDCLOUD = '<:SOUNDCLOUD:1056946989834719352>'

        return {
            OK,
            ERROR,
            DIAMOND,
            SPOTIFY,
            YANDEXMUSIC,
            SOUNDCLOUD,
            details: {
                OK: parseEmoji(OK),
                ERROR: parseEmoji(ERROR),
                DIAMOND: parseEmoji(DIAMOND),
                SPOTIFY: parseEmoji(SPOTIFY),
                YANDEXMUSIC: parseEmoji(YANDEXMUSIC),
                SOUNDCLOUD: parseEmoji(SOUNDCLOUD)
            }
        }
    }

    async start() {
        await this.db.connect()
        this.logger.log('[Lacuna] Connected to database')

        this.cluster = new ClusterClient(this)
        this.machine = new BridgeShard(this.cluster)

        this.rest.on('rateLimited', rateLimitData => this.logger.warn(`[DiscordRateLimited] ${JSON.stringify(rateLimitData)}`))

        await this.login(process.env.LCN_DISCORD_CLIENT_TOKEN)
        this.logger.log('[Lacuna] Connected to Discord client')

        this.loadEvents(true)
        this.loadCommands()

        this.application = await this.application.fetch()
        this.logger.log('[Lacuna] Discord client application fetched')

        handleGiveawayEntries(this)
        handleTemporaryBanEntries(this)
        handleTemporaryRoleEntries(this)

        process.on('unhandledRejection', error => {
            const err = (error as any)?.stack ?? (error as any).message

            this.logger.error('[UnhandledRejection]', err)
        })

        process.on('uncaughtException', error => {
            const err = (error as any)?.stack ?? (error as any).message

            this.logger.error('[UncaughtException]', err)
        })
    }

    async updateApplicationCommands(server: ServerDocument) {
        const commands = await this.application.commands.set(
            server.modules.custom_commands.map(i => i.command),
            server._id
        )

        await this.db.servers.updateOne(
            { _id: server._id },
            {
                $set: {
                    'modules.custom_commands': commands.map(i => {
                        const custom = server.modules.custom_commands.find(ii => ii.command.name === i.name)

                        return {
                            id: i.id,
                            options: custom.options,
                            components: custom.components,
                            command: custom.command
                        }
                    })
                }
            }
        )

        return commands
    }

    getMusicNodes() {
        const nodes = [...this.lava?.nodes.cache.values()]

        return (
            nodes?.map(node => {
                return {
                    id: node.options.name,
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

    loadCommands() {
        this.logger.log('[Lacuna] Loading commands...')

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

        this.logger.log(`[Lacuna] Loaded ${amount} commands from ${directories.length} categories`)
    }

    loadEvents(initial = false) {
        this.logger.log('[Lacuna]', initial ? 'Loading initial events...' : 'Loading events...')

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

        this.logger.log(`[Lacuna] Loaded ${amount} events of ${total}`)
    }
}
