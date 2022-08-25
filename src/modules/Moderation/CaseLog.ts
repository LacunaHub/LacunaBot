import { BaseGuildTextChannel, Guild, MessageEmbed, User } from 'discord.js'
import reason from '../../commands/moderation/reason'
import db from '../../database'
import i18n from '../../i18n'
import { images } from '../Logs'

export async function createCaseEntry(guild: Guild, options: ICreateCaseMessageOptions) {
    const server = await db.servers.findOne({ _id: guild.id })
    const caseLog = guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel

    if (caseLog && server.moderation.case_log.types[options.type].active) {
        const t = i18n.t.bind(null, server.locale)
        const caseId = server.moderation.case_log.case_count + 1

        await caseLog
            .send({
                embeds: [
                    new MessageEmbed()
                        .setAuthor({ name: t(`case_log.cases.${options.type}`), iconURL: images[options.type] })
                        .addFields([
                            { name: t('common.command_option_types.USER'), value: options.target ? `${options.target.tag}\n(${options.target.id})` : '-', inline: true },
                            { name: t('case_log.moderator'), value: options.executor.tag, inline: true },
                            { name: t('case_log.reason'), value: options.reason ?? '-' }
                        ])
                        .setFooter({ text: t('case_log.case_number', { case_number: caseId }) })
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
