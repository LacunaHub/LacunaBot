import { ServerLogEntry } from '@lacunahub/lacuna-database-driver'
import { Logger, TelegramLogger } from '@lacunahub/logger'
import database from '../database'

const logger = new Logger()

export default {
    log: (...args: any[]) => logger.log(...args),
    debug: (...args: any[]) => logger.debug(...args),
    info: (...args: any[]) => logger.info(...args),
    warn: (...args: any[]) => logger.warn(...args),
    error: (...args: any[]) => logger.error(...args),

    telegram: new TelegramLogger({
        botToken: process.env.LCN_TELEGRAM_BOT_TOKEN,
        chatId: process.env.LCN_TELEGRAM_LOG_CHAT_ID as any
    }),

    async appendServerLog(guildId: string, data: Partial<ServerLogEntry>) {
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
    },

    async handleError(data: { module: string; action?: string; error: any; guild_id?: string }) {
        const err = data.error.toString()

        logger.error(`[${data.module}${data.action ?? ''}]`, err, data.guild_id ? `(occurred on ${data.guild_id})` : '')

        if (typeof data.guild_id === 'string') {
            await this.appendServerLog(data.guild_id, {
                level: 'ERROR',
                module: data.module,
                action: data.action,
                message: err
            })
        }
    }
}
