import Lacuna from '../../../internals/Lacuna'
import { ActionOptions } from './BanAction'

export default async function modifyRolesAction(self: Lacuna, options: ActionOptions) {
    const { config, guild, target, reason } = options

    if (config.modify_roles?.add?.length) {
        const editableRoles = guild.roles.cache.filter(v => v.editable && config.modify_roles.add.includes(v.id))

        if (editableRoles.size) {
            try {
                await target.roles.add(editableRoles, reason)
            } catch (err) {
                await self.logger.handleError({ module: 'AutoMod', action: 'AddRoles', error: err, guild_id: guild.id })
            }
        }
    }

    if (config.modify_roles?.remove?.length) {
        const editableRoles = guild.roles.cache.filter(v => v.editable && config.modify_roles.remove.includes(v.id))

        if (editableRoles.size) {
            try {
                await target.roles.remove(editableRoles, reason)
            } catch (err) {
                await self.logger.handleError({ module: 'AutoMod', action: 'RemoveRoles', error: err, guild_id: guild.id })
            }
        }
    }
}
