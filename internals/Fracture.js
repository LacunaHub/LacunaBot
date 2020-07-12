const { Client, Collection } = require('discord.js')
const { connect } = require('mongoose')
const fs = require('fs-extra')

const Logger = require('./Logger')
const DatabaseManager = require('../database/DatabaseManager')
const Player = require('./structures/Player')
const Translator = require('./locale/Translator')

class Fracture extends Client {
    /**
     * @param {import('discord.js').ClientOptions} [options]
     */
    constructor(options = {}) {
        super(options)

        this.commands = new Collection()

        /**
         * @type {Collection<String, import('./structures/TemporaryBan')>}
         */
        this.tempbans = new Collection()

        /**
         * @type {Collection<String, import('./structures/TemporaryMute')>}
         */
        this.tempmutes = new Collection()

        this.player = new Player(this, { user: process.env.CLIENT_ID, shards: process.env.CLIENT_MAX_SHARDS })

        this.logger = Logger

        this.db = DatabaseManager

        this.translator = Translator

        this.start()
    }

    async start() {
        connect(process.env.DB_URL, { useNewUrlParser: true })

        this.login(process.env.CLIENT_TOKEN)

        this.LoadCommands()
        this.LoadEvents()

        process.on('unhandledRejection', err => {
            if (err.name != 'DiscordAPIError') {
                const _err = err.stack ? err.stack : err.message

                this.logger.error('(Unhandled Rejection)', _err)
                //this.logger.telegram.error('`Unhandled Rejection`', `\`\`\`\n${_err}\n\`\`\``)
            }
        })

        return Date.now()
    }

    LoadCommands() {
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
                        const command = require(`../commands/${dir}/${file}`)

                        new Command(this, command.config)
                        delete require.cache[require.resolve(`../commands/${dir}/${file}`)]
                    })
        
                    progress++
                    if (progress == dirs.length) logger.info(`(Commands): Loaded ${this.commands.size} commands in ${dirs.length} categories`)
                })
            })
        })
    }

    LoadEvents() {
        fs.readdir('./events', async (err, files) => {
            if (err) {
                logger.error(err)

                return
            }

            const dirs = files.filter(f => !f.includes('.'))

            let progress = 0

            dirs.forEach(dir => {
                fs.readdir(`./commands/${dir}`, (err, _files) => {
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
                        const event_name = event.config.name
        
                        this.on(event_name, event.bind(null, this))
                        delete require.cache[require.resolve(`../events/${dir}/${file}`)]
                    })

                    progress++
                    if (progress == dirs.length) logger.info(`(Events): Loaded ${this.listenerCount()} events`)
                })
            })
        })
    }
}

module.exports = Fracture