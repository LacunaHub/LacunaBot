import Lacuna from '../../../internals/Lacuna'
import { createCaseLogEntry } from '../../Moderation/CaseLog'
import { ActionOptions } from './BanAction'

export default async function kickAction(self: Lacuna, options: KickActionOptions) {
    const { guild, target, reason } = options

    try {
        await target.kick(reason)
    } catch (err) {
        await self.logger.handleError({ module: 'AutoMod', action: 'Kick', error: err, guild_id: guild.id })
    }

    await createCaseLogEntry(guild, { type: 'Kick', target: target.user, executor: self.user, reason })
}

export interface KickActionOptions extends Omit<ActionOptions, 'config'> {}
