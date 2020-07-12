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
    static logCommand(command, message, ...args) {
        console.log(`[LOG] – [${moment().format()}]: (Command: ${command}): [g: (${message.guild.name}:${message.guild.id}), c: (${message.channel.name}:${message.channel.id}), a: (${message.author.tag}:${message.author.id})]`, ...args)
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