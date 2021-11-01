const { Client, Collection, Permissions } = require('discord.js')
const { connect } = require('mongoose')
const fs = require('fs-extra')
const Utils = require('../internals/utility/Utils')

const Command = require('./structures/Command')
const logger = require('./Logger')
const DatabaseManager = require('../database/DatabaseManager')
const Translator = require('./locale/Translator')
const qdb = require('quick.db')

const TemporaryBan = require('./structures/TemporaryBan')
const TemporaryMute = require('./structures/TemporaryMute')
const TemporaryRole = require('./structures/TemporaryRole')
const Giveaway = require('./structures/Giveaway')
const Twitch = require('../modules/Twitch')
const YouTube = require('../modules/YouTube')
const Levels = require('../modules/Levels')
const { resolveObjectPath } = require('../internals/utility/Utils')

class Lacuna extends Client {
    /**
     * @param {import('discord.js').ClientOptions} [options]
     */
    constructor(options = {}) {
        super(options)

        this.utils = Utils

        /**
         * @type {import('erela.js').Manager}
         */
        this.player = null

        /**
         * @type {Collection<String, Command}
         */
        this.commands = new Collection()

        /**
         * @type {Collection<String, TemporaryBan>}
         */
        this.tempbans = new Collection()

        /**
         * @type {Collection<String, TemporaryMute>}
         */
        this.tempmutes = new Collection()

        /**
         * @type {Collection<String, TemporaryRole>}
         */
        this.temproles = new Collection()

        /**
         * @type {Collection<String, Giveaway>}
         */
        this.giveaways = new Collection()

        this.logger = logger

        this.db = DatabaseManager

        this.qdb = qdb

        this.translator = Translator

        this.player = null

        this.PERMISSIONS_FLAGS = Permissions.FLAGS

        this.start()
    }

    get _emojis() {
        return {
            OK: '<:OK:761265867950260284>',
            ERROR: '<:ERROR:761265867110481970>',
            WARNING: '<:WARNING:761920271669395496>',
            details: {
                OK: {
                    animated: false,
                    id: '761265867950260284',
                    name: 'OK'
                },
                ERROR: {
                    animated: false,
                    id: '761265867110481970',
                    name: 'ERROR'
                },
                WARNING: {
                    animated: false,
                    id: '761920271669395496',
                    name: 'WARNING'
                }
            }
        }
    }

    get playerNodesStats() {
        const nodes = this.player.nodes

        return nodes.map(node => {
            return {
                id: node.options.identifier,
                connected: node.connected,
                cpu_load: Math.round(node.stats.cpu.lavalinkLoad),
                memory_usage: Math.round((node.stats.memory.used * 100) / node.stats.memory.reservable),
                uptime: node.stats.uptime,
                players: {
                    playing: node.stats.playingPlayers,
                    total: node.stats.players
                }
            }
        })
    }

    async start() {
        await connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })

        await this.login(process.env.CLIENT_TOKEN)

        await this.loadEvents(true)

        this.application = await this.application.fetch()

        //await this.registerSlashCommands()

        await TemporaryBan.HandleEntries(this)
        await TemporaryMute.HandleEntries(this)
        await TemporaryRole.HandleEntries(this)
        await Giveaway.HandleEntries(this)
        await Twitch.scheduleCheck(this)
        await YouTube.scheduleCheck(this)
        await Levels.checkVoiceStates(this)

        process.on('unhandledRejection', error => {
            const err = error?.stack ?? error.message

            this.logger.error('(Unhandled Rejection)', err)

            if (typeof err === 'string' && !err.includes('DiscordAPIError')) {
                this.logger.telegram.error('`Unhandled Rejection`', `\`\`\`\n${err}\n\`\`\``)
            }
        })

        return Date.now()
    }

    async registerSlashCommands(guild_id, lang) {
        const locale = this.translator.locale(lang)

        const slash = this.commands.filter(c => c.is_slash_command).map(c => {
            return {
                name: c.name,
                description: resolveObjectPath(c.description, locale),
                type: 'CHAT_INPUT',
                options: c?.options?.map(option => {
                    if (option.type == 'SUB_COMMAND') return {
                        ...option,
                        description: resolveObjectPath(option.description, locale),
                        options: option.options.map(o => {
                            return {
                                ...o,
                                name: resolveObjectPath(o.name, locale),
                                description: resolveObjectPath(o.description, locale)
                            }
                        })
                    }

                    return {
                        ...option,
                        name: resolveObjectPath(option.name, locale),
                        description: resolveObjectPath(option.description, locale)
                    }
                }) ?? []
            }
        })

        const message = this.commands.filter(c => c.is_message_command).map(c => {
            return {
                name: resolveObjectPath(c.pretty_name, locale),
                type: 'MESSAGE'
            }
        })

        const user = this.commands.filter(c => c.is_user_command).map(c => {
            return {
                name: resolveObjectPath(c.pretty_name, locale),
                type: 'USER'
            }
        })

        const commands = [ ...slash, ...message, ...user ]

        return await this.application.commands.set(commands, guild_id)
    }

    loadCommands() {
        const directories = fs.readdirSync('./commands', { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name)

        let amount = 0

        for (const directory of directories) {
            const dirs = fs.readdirSync(`./commands/${directory}`, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name)

            for (const dir of dirs) {
                /**
                 * @type {import('./Typings').CommandInfo}
                 */
                const index = require(`../commands/${directory}/${dir}`)

                new Command(this, index)

                delete require.cache[require.resolve(`../commands/${directory}/${dir}`)]
            }

            amount += dirs.length
        }

        this.logger.info(`(Commands): Loaded ${amount} commands from ${directories.length} categories`)
    }

    loadEvents(initial = false) {
        const directories = fs.readdirSync('./events', { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name)

        let amount = 0, total = 0

        for (const directory of directories) {
            const files = fs.readdirSync(`./events/${directory}`, { withFileTypes: true }).filter(dirent => dirent.isFile() && dirent.name.endsWith('.js')).map(dirent => dirent.name)
            /**
             * @type {import('./Typings').EventInfo[]}
             */
            let events = files.map(file => require(`../events/${directory}/${file}`))
            events = events.filter(e => Boolean(e.initial) == initial)

            for (const event of events) {
                event.once ? this.once(event.name, event.handler.bind(null, this)) : this.on(event.name, event.handler.bind(null, this))
            }

            for (const file of files) delete require.cache[require.resolve(`../events/${directory}/${file}`)]

            amount += events.length
            total += files.length
        }

        this.logger.info(`(Events): Loaded ${amount} events of ${total}`)
    }
}

module.exports = Lacuna