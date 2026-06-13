import { ServerDocument } from '@/database/schemas/Servers'
import moment from 'moment'
import ms from 'ms'
import Lacuna from '../../../internals/Lacuna'
import { createCaseLogEntry } from '../../Moderation/CaseLog'
import { ActionOptions } from './BanAction'

export default async function muteAction(self: Lacuna, server: ServerDocument, options: ActionOptions) {
    const { config, guild, target } = options
    let { reason } = options

    const expiresAt = Date.now() + (config.mute_timeout ? config.mute_timeout * 1000 : ms('2h'))
    reason += ` (${moment(expiresAt).locale(server.locale).fromNow(true)})`

    try {
        await target.disableCommunicationUntil(expiresAt, reason)
    } catch (err) {
        self.logger.error({ module: 'AutoMod', action: 'DisableCommunication', err, guildId: guild.id })
    }

    await createCaseLogEntry(guild, { type: 'MuteAdd', target: target.user, executor: self.user, reason })

    if (server.moderation.mutes.rar) {
        const currentRoles = target.roles.cache.filter(r => r.editable && r.id !== guild.id).map(r => r.id)

        await self.db.servers.updateOne(
            { _id: guild.id },
            {
                $push: {
                    'moderation.mutes.rar_data': {
                        user_id: target.id,
                        roles: currentRoles
                    }
                }
            }
        )

        const strictRoles = [
            ...server.moderation.mutes.rar_strict.filter(r => currentRoles.includes(r)),
            ...target.roles.cache.filter(v => !v.editable).map(r => r.id)
        ]

        try {
            await target.roles.set(strictRoles, reason)
        } catch (err) {
            self.logger.error({ module: 'AutoMod', action: 'MuteRemoveAllRoles', err, guildId: guild.id })
        }
    }
}
