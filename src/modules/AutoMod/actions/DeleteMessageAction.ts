import Lacuna from '../../../internals/Lacuna'
import { SendMessageActionOptions } from './SendMessageAction'

export default async function deleteMessageAction(self: Lacuna, options: DeleteMessageActionOptions) {
    const { message } = options

    try {
        await message.delete()
    } catch (err) {
        await self.logger.handleError({ module: 'AutoMod', action: 'DeleteMessage', error: err, guild_id: message.guildId })
    }
}

export interface DeleteMessageActionOptions extends Omit<SendMessageActionOptions, 'config'> {}
