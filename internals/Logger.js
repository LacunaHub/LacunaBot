const moment = require('moment')
const request = require('node-fetch')

class Logger {
    static log(message, ...args) {
        console.log(`[LOG: ${moment().format()}]:`, message, ...args)
    }

    static dir(message, ...args) {
        console.dir(`[DIR: ${moment().format()}]:`, message, ...args)
    }

    static info(message, ...args) {
        console.info(`[INFO: ${moment().format()}]:`, message, ...args)
    }

    static trace(message, ...args) {
        console.trace(`[TRACE: ${moment().format()}]:`, message, ...args)
    }

    static warn(message, ...args) {
        console.warn(`[WARNING: ${moment().format()}]:`, message, ...args)
    }

    static debug(message, ...args) {
        console.debug(`[DEBUG: ${moment().format()}]:`, message, ...args)
    }

    static error(message, ...args) {
        console.error(`[ERROR: ${moment().format()}]:`, message, ...args)
    }
}

class TelegramLogger {
    static get base_url() {
        return `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`
    }

    static async log(message, ...args) {
        const options = {
            url: this.base_url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: process.env.TELEGRAM_LOG_CHAT_ID,
                text: `✏ *LOG* | ${message} ${args.join(' ')}`,
                parse_mode: 'Markdown',
                disable_notification: true
            })
        }

        await request(this.base_url, options)
    }

    static async info(message, ...args) {
        const options = {
            url: this.base_url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: process.env.TELEGRAM_LOG_CHAT_ID,
                text: `ℹ *INFO* | ${message} ${args.join(' ')}`,
                parse_mode: 'Markdown',
                disable_notification: true
            })
        }

        await request(this.base_url, options)
    }

    static async warn(message, ...args) {
        const options = {
            url: this.base_url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: process.env.TELEGRAM_LOG_CHAT_ID,
                text: `⚠ *WARN* | ${message} ${args.join(' ')}`,
                parse_mode: 'Markdown'
            })
        }

        await request(this.base_url, options)
    }

    static async error(message, ...args) {
        const options = {
            url: this.base_url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: process.env.TELEGRAM_LOG_CHAT_ID,
                text: `‼ *ERROR* | ${message} ${args.join(' ')}`,
                parse_mode: 'Markdown'
            })
        }

        await request(this.base_url, options)
    }
}

module.exports = Logger
module.exports.telegram = TelegramLogger