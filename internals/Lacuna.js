const { Client, Collection } = require('discord.js')
const { connect } = require('mongoose')
const fs = require('fs-extra')
const Utils = require('../internals/utility/Utils')

const Command = require('./structures/Command')
const Subcommand = require('./structures/Subcommand')
const logger = require('./Logger')
const DatabaseManager = require('../database/DatabaseManager')
const Player = require('./structures/Player')
const Translator = require('./locale/Translator')

const TemporaryBan = require('./structures/TemporaryBan')
const TemporaryMute = require('./structures/TemporaryMute')
const TemporaryRole = require('./structures/TemporaryRole')
const Giveaway = require('./structures/Giveaway')
const Twitch = require('../modules/Twitch')
const YouTube = require('../modules/YouTube')

class Lacuna extends Client {
    /**
     * @param {import('discord.js').ClientOptions} [options]
     */
    constructor(options = {}) {
        super(options)

        this.start_timestamp = null

        this.application = null

        this.utils = Utils

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

        this.translator = Translator

        this.player = null

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

    async start() {
        this.start_timestamp = Date.now()

        await connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })

        await this.login(process.env.CLIENT_TOKEN)

        this.loadcommands()
        this.loadevents()

        this.player = new Player(this, { user: process.env.CLIENT_ID, shards: Number(process.env.CLIENT_MAX_SHARDS) })
        this.application = await this.fetchApplication()

        await TemporaryBan.HandleEntries(this)
        await TemporaryMute.HandleEntries(this)
        await TemporaryRole.HandleEntries(this)
        await Giveaway.HandleEntries(this)
        await Twitch.scheduleCheck(this)
        await YouTube.scheduleCheck(this)

        process.on('unhandledRejection', error => {
            const err = error.stack ? error.stack : error.message

            this.logger.error('(Unhandled Rejection)', err)

            if (typeof err === 'string' && !err.includes('DiscordAPIError')) {
                this.logger.telegram.error('`Unhandled Rejection`', `\`\`\`\n${err}\n\`\`\``)
            }
        })

        return Date.now()
    }

    /**
     * Загрузка всех команд
     * 
     * @private
     */
    loadcommands() {
        fs.readdir("./commands", async (err, files) => {
            if (err) {
                logger.error(err)
            
                return
            }
        
            const dirs = files.filter(f => !f.includes('.'))

            let progress = 0

            dirs.forEach((dir) => {
                fs.readdir(`./commands/${dir}`, (err, _files) => {
                    if (err) {
                        logger.error(err)

                        return
                    }
        
                    const js = _files.filter(f => f.endsWith('.js'))
                    if (js.length <= 0) {
                        logger.warn(`(Commands): Commands not found`)
                    
                        return
                    }
            

                    js.forEach(file => {
                        const command_config = require(`../commands/${dir}/${file}`)

                        const command = new Command(this, command_config)

                        if (command_config.subcommands) {
                            for (const subcommand of command_config.subcommands) {
                                new Subcommand(command, subcommand)
                            }
                        }

                        delete require.cache[require.resolve(`../commands/${dir}/${file}`)]
                    })
        
                    progress++
                    if (progress == dirs.length) logger.info(`(Commands): Loaded ${this.commands.size} commands in ${dirs.length} categories`)
                })
            })
        })
    }

    /**
     * Загрузка всех событий
     * 
     * @private
     */
    loadevents() {
        fs.readdir('./events', async (err, files) => {
            if (err) {
                logger.error(err)

                return
            }

            const dirs = files.filter(f => !f.includes('.'))

            let progress = 0
            let events = 0

            dirs.forEach(dir => {
                fs.readdir(`./events/${dir}`, (err, _files) => {
                    if (err) {
                        logger.error(err)
        
                        return
                    }

                    const js = _files.filter(f => f.endsWith('.js'))
                    if (js.length <= 0) {
                        logger.log(`(Events): Events not found`)
                    
                        return
                    }

                    js.forEach(file => {
                        const event = require(`../events/${dir}/${file}`)
        
                        this.on(event.name, event.fn.bind(null, this))
                        delete require.cache[require.resolve(`../events/${dir}/${file}`)]
                    })

                    progress++
                    events += js.length
                    if (progress == dirs.length) logger.info(`(Events): Loaded ${events} events in ${progress} categories`)
                })
            })
        })
    }
}

module.exports = Lacuna