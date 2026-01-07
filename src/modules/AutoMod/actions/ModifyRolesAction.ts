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
                self.logger.error({ module: 'AutoMod', action: 'AddRoles', err, guildId: guild.id })
            }
        }
    }

    if (config.modify_roles?.remove?.length) {
        const editableRoles = guild.roles.cache.filter(v => v.editable && config.modify_roles.remove.includes(v.id))

        if (editableRoles.size) {
            try {
                await target.roles.remove(editableRoles, reason)
            } catch (err) {
                self.logger.error({ module: 'AutoMod', action: 'RemoveRoles', err, guildId: guild.id })
            }
        }
    }
}
