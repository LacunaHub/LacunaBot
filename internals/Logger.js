const moment = require('moment')

class Logger {
    constructor() {
        throw new Error(`The ${this.constructor.name} class can't be called via 'new'`)
    }

    static log(message, ...args) {
        console.log(`[LOG] – [${moment().format()}]:`, message, ...args)
    }

    /**
     * @param {String} command
     * @param {import('discord.js').Message} message
     */
    static logc(command, message, ...args) {
        console.log(`[LOG] – [${moment().format()}]: (Command: ${command}): (${message.guild.name}:${message.guild.id}) (${message.channel.name}:${message.channel.id}) (${message.author.tag}:${message.author.id})`, ...args)
    }

    /**
     * @param {import('../internals/Typings').ModuleExecutionData} data
     */
    static logm(data) {
        console.log(`[LOG] – [${moment().format()}]: (Module: ${data.module}): (${data.guild.name}:${data.guild.id}) (${data.target.name}:${data.target.id})`)
    }

    static dir(message, ...args) {
        console.dir(`[DIR] – [${moment().format()}]:`, message, ...args)
    }

    static info(message, ...args) {
        console.info(`[INFO] – [${moment().format()}]:`, message, ...args)
    }

    static trace(message, ...args) {
        console.trace(`[TRACE] – [${moment().format()}]:`, message, ...args)
    }

    static warn(message, ...args) {
        console.warn(`[WARNING] – [${moment().format()}]:`, message, ...args)
    }

    static debug(message, ...args) {
        console.debug(`[DEBUG] – [${moment().format()}]:`, message, ...args)
    }

    static error(message, ...args) {
        console.error(`[ERROR] – [${moment().format()}]:`, message, ...args)
    }
}

module.exports = Logger