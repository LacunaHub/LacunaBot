import { ServerLogEntry } from '@lacunahub/lacuna-database-driver'
import moment from 'moment'
import fetch from 'node-fetch'
import database from '../database'

const telegram_base_url: string = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`

async function appendServerLog(guildId: string, data: Partial<ServerLogEntry>) {
    await database.servers.updateOne(
        { _id: guildId },
        {
            $push: {
                logs: {
                    $each: [
                        {
                            level: data.level,
                            timestamp: Date.now(),
                            module: data.module,
                            action: data.action ?? null,
                            message: data.message
                        }
                    ],
                    $slice: -250
                }
            }
        }
    )
}

export default {
    log(...args: any[]) {
        console.log(`[LOG: ${moment().format()}] -`, ...args)
    },

    dir(...args: any[]) {
        console.dir(`[DIR: ${moment().format()}] -`, ...args)
    },

    info(...args: any[]) {
        console.info(`[INFO: ${moment().format()}] -`, ...args)
    },

    trace(...args: any[]) {
        console.trace(`[TRACE: ${moment().format()}] -`, ...args)
    },

    warn(...args: any[]) {
        console.warn(`[WARNING: ${moment().format()}] -`, ...args)
    },

    debug(...args: any[]) {
        console.debug(`[DEBUG: ${moment().format()}] -`, ...args)
    },

    error(...args: any[]) {
        console.error(`[ERROR: ${moment().format()}] -`, ...args)
    },

    telegram: {
        async log(...args: any) {
            await fetch(telegram_base_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: process.env.TELEGRAM_LOG_CHAT_ID,
                    text: `✏ *LOG* | ${args.join(' ')}`,
                    parse_mode: 'Markdown',
                    disable_notification: true
                })
            })
        },

        async info(...args: any[]) {
            await fetch(telegram_base_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: process.env.TELEGRAM_LOG_CHAT_ID,
                    text: `ℹ *INFO* | ${args.join(' ')}`,
                    parse_mode: 'Markdown',
                    disable_notification: true
                })
            })
        },

        async warn(...args: any[]) {
            await fetch(telegram_base_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: process.env.TELEGRAM_LOG_CHAT_ID,
                    text: `⚠ *WARN* | ${args.join(' ')}`,
                    parse_mode: 'Markdown'
                })
            })
        },

        async error(...args: any[]) {
            await fetch(telegram_base_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: process.env.TELEGRAM_LOG_CHAT_ID,
                    text: `‼ *ERROR* | ${args.join(' ')}`,
                    parse_mode: 'Markdown'
                })
            })
        }
    },

    async handleError(data: { module: string; action?: string; error: any; guild_id?: string }) {
        const err = data.error.toString()

        console.error(
            `[ERROR: ${new Date().toISOString()}] -`,
            `[${data.module}${data.action ?? ''}]`,
            err,
            data.guild_id ? `(occurred on ${data.guild_id})` : ''
        )

        if (typeof data.guild_id === 'string') {
            await appendServerLog(data.guild_id, {
                level: 'ERROR',
                module: data.module,
                action: data.action,
                message: err
            })
        }
    },

    appendServerLog
}
