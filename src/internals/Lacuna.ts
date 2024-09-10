import { EnvData, ServerDocument } from '@lacunahub/lacuna-database-driver'
import { LavalunaManager } from '@lacunahub/lavaluna.js'
import { ClusterShardClient, ClusterShardClientOptions } from '@lacunahub/letsfrag'
import { Collection, Guild, PermissionsBitField } from 'discord.js'
import { readdirSync, readFileSync } from 'fs'
import { Isolate } from 'isolated-vm'
import { os } from 'node-os-utils'
import db from '../database'
import i18n from '../i18n'
import logger from './Logger'
import { Command, CommandOptions } from './structures/Command'
import Event, { EventOptions } from './structures/Event'
import Giveaway, { handleEntries as handleGiveawayEntries } from './structures/Giveaway'
import TemporaryBan, { handleEntries as handleTemporaryBanEntries } from './structures/TemporaryBan'
import TemporaryRole, { handleEntries as handleTemporaryRoleEntries } from './structures/TemporaryRole'

export default class Lacuna extends ClusterShardClient {
    public hostname: string
    public logger: typeof logger
    public db: typeof db
    public cache = new Map<string, any>()
    public commands = new Collection<string, Command>()
    public events = new Collection<string, Event>()
    public lava: LavalunaManager | null = null
    public isolates = new Collection<string, IsolateState>()
    public giveaways = new Collection<string, Giveaway>()
    public tempbans = new Collection<string, TemporaryBan>()
    public temproles = new Collection<string, TemporaryRole>()
    public i18n: typeof i18n
    public PermissionFlags: typeof PermissionsBitField.Flags

    public get staticEmojis(): Record<string, string> {
        return Object.assign(
            {},
            ...this.application.emojis.cache.map(v => {
                return {
                    [v.name]: v.toString()
                }
            })
        )
    }

    constructor(options?: ClusterShardClientOptions) {
        super(options)

        this.hostname = os.hostname()

        this.logger = logger

        this.db = db

        this.i18n = i18n

        this.PermissionFlags = PermissionsBitField.Flags

        this.start()

        // Sweep unused isolates
        setInterval(() => {
            const currentDate = Date.now()

            this.isolates.sweep(v => {
                const { lastUsed, value } = v
                const shouldSweep = Math.floor(currentDate - lastUsed) > 1000 * 60 * 60

                if (shouldSweep) {
                    if (!value.isDisposed) value.dispose()
                }

                return shouldSweep
            })
        }, 1000 * 60 * 30)
    }

    async start() {
        await this.db.connect()
        this.logger.log('[Lacuna] Connected to database')

        this.rest.on('rateLimited', rateLimitData => this.logger.warn(`[DiscordRateLimited] ${JSON.stringify(rateLimitData)}`))

        await this.login(process.env.LCN_DISCORD_CLIENT_TOKEN)
        this.logger.log('[Lacuna] Connected to Discord client')

        this.loadEvents(true)
        this.loadCommands()

        this.application = await this.application.fetch()
        this.logger.log('[Lacuna] Discord client application fetched')
        await this.application.emojis.fetch()
        this.logger.log('[Lacuna] Application emojis fetched')

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

    public async getEnv() {
        let env: EnvData & { _updated_at: number } = this.cache.get('environment')

        if (!env || Date.now() - env._updated_at > 300_000) {
            const dbEnv = await this.db.getEnv()
            env = { ...dbEnv, _updated_at: Date.now() }
        }

        return env
    }

    public async updateApplicationCommands(server: ServerDocument) {
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

    public async fetchGuild(guild: Guild) {
        const lastFetchedAt = this.cache.get(`last-guild-fetch-${guild.id}`) ?? 0

        if (
            typeof guild.approximatePresenceCount !== 'number' ||
            typeof guild.approximateMemberCount !== 'number' ||
            Date.now() - lastFetchedAt > 1000 * 60 * 60
        ) {
            this.cache.set(`last-guild-fetch-${guild.id}`, Date.now())
            return await guild.fetch()
        }

        return guild
    }

    public loadCommands() {
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
                const commandOptions: CommandOptions = require(`../commands/${directory}/${dir}`).default
                const command = new Command(this, dir, commandOptions)

                this.commands.set(command.name, command)
                delete require.cache[require.resolve(`../commands/${directory}/${dir}`)]
            }

            amount += dirs.length
        }

        this.logger.log(`[Lacuna] Loaded ${amount} commands from ${directories.length} categories`)
    }

    public loadEvents(initial = false) {
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

    public loadEmojis() {
        this.logger.log('[Lacuna] Loading emojis...')

        const files = readdirSync('./assets/emojis', { withFileTypes: true }).filter(v => v.isFile())
        const emojis = files.map(v => {
            const ext = v.name.split('.').pop(),
                name = v.name.slice(0, -`.${ext}`.length)

            return {
                name,
                extension: ext,
                image: readFileSync(`./assets/emojis/${v.name}`)
            }
        })

        this.logger.log(`[Lacuna] Loaded ${emojis.length} emojis`)

        return emojis
    }
}

export interface IsolateState {
    value: Isolate
    lastUsed: number
}
