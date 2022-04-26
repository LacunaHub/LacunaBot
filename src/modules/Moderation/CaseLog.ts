import { BaseGuildTextChannel, Guild, MessageEmbed, User } from 'discord.js'
import reason from '../../commands/moderation/reason'
import db from '../../database'
import { ServerDocument } from '../../database/schemas/Servers'
import translator from '../../internals/locale'
import { images } from '../Logs'

export async function createCaseEntry(server: ServerDocument, guild: Guild, options: ICreateCaseMessageOptions) {
    const caseLog = guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel

    if (caseLog && server.moderation.case_log.case_types[options.type]) {
        const locale = translator.locale(server.locale)
        const caseId = server.moderation.case_log.case_count + 1

        await caseLog
            .send({
                embeds: [
                    new MessageEmbed()
                        .setAuthor({ name: locale.commands.common.case_log.cases[options.type], iconURL: images[options.type] })
                        .addField(locale.commands.common.case_log.target, options.target ? `${options.target.tag}\n(${options.target.id})` : '-', true)
                        .addField(locale.commands.common.case_log.executor, options.executor.tag, true)
                        .addField(locale.commands.common.case_log.reason, options.reason ?? '-')
                        .setFooter({ text: translator.format(locale.commands.common.case_log.case, caseId) })
                        .setTimestamp()
                        .setColor(options.type.endsWith('REMOVE') ? '#2FDF84' : '#EF5350')
                ]
            })
            .catch(() => {})

        await db.servers.updateOne(
            { _id: server._id },
            {
                $inc: {
                    'moderation.case_log.case_count': 1
                },
                $push: {
                    'moderation.case_log.cases': {
                        case_id: caseId,
                        type: options.type,
                        timestamp: Date.now(),
                        reason: reason ?? null,
                        target: {
                            id: options.target ? options.target.id : null,
                            name: options.target ? options.target.tag : null
                        },
                        executor: {
                            id: options.executor.id,
                            name: options.executor.tag
                        }
                    }
                }
            }
        )
    }
}

export interface ICreateCaseMessageOptions {
    type: 'BAN_ADD' | 'BAN_REMOVE' | 'KICK' | 'MUTE_ADD' | 'MUTE_REMOVE' | 'PRUNE_MESSAGES' | 'WARN_ADD' | 'WARN_REMOVE'
    target?: User
    executor: User
    reason?: string
}
